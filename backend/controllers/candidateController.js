const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const logger = require('../utils/logger');
const { respondWithSuccess, respondWithError, createPagination } = require('../utils/apiResponse');
const cvParserService = require('../services/cvParserService');
const storageService = require('../services/storageService');
const matchingService = require('../services/matchingService');
const { getCvFileUrl } = require('../utils/helpers');

/**
 * Récupère tous les candidats avec filtres et pagination
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getCandidates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      jobId,
      status,
      sortBy = 'matchingScore',
      sortDirection = 'desc'
    } = req.query;

    // Convertir page et limit en nombres
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Construire la clause where pour les filtres
    const where = {};
    
    // Filtre par jobId si fourni
    if (jobId) {
      where.jobId = jobId;
    }

    // Filtre par statut si fourni
    if (status) {
      // Si status est un tableau, utiliser 'in'
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    // Filtre de recherche par nom, email ou compétences
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } }
      ];
    }

    // Récupérer le nombre total de candidats correspondant aux filtres
    const totalCandidates = await prisma.candidate.count({ where });

    // Construire l'ordre de tri
    const orderBy = {};
    orderBy[sortBy] = sortDirection;

    // Récupérer les candidats avec pagination
    const candidates = await prisma.candidate.findMany({
      where,
      orderBy,
      skip,
      take: limitInt,
      include: {
        job: {
          select: {
            title: true
          }
        }
      }
    });

    // Formater les candidats pour la réponse
    const formattedCandidates = candidates.map(candidate => {
      // Ajouter jobTitle aux candidats
      const { job, ...candidateData } = candidate;
      return {
        ...candidateData,
        jobTitle: job.title
      };
    });

    // Créer l'objet de pagination
    const pagination = createPagination(pageInt, limitInt, totalCandidates);

    return respondWithSuccess(
      res,
      200,
      'Candidats récupérés avec succès',
      formattedCandidates,
      pagination
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des candidats: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération des candidats', error.message);
  }
};

/**
 * Récupère un candidat spécifique par ID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    

    // Récupérer le candidat avec ses notes et documents
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true
          }
        },
        notes: {
          orderBy: {
            createdAt: 'desc'
          }
        }
        // documents: true
      }
    });

    if (!candidate) {
      return respondWithError(res, 404, 'Candidat non trouvé');
    }

    // Formater le candidat pour la réponse
    const { job, ...candidateData } = candidate;
    const formattedCandidate = {
      ...candidateData,
      jobId: job.id,
      jobTitle: job.title
    };

    // Générer des URL signées pour les documents si en production
    if (process.env.NODE_ENV === 'production') {
      // Générer l'URL signée pour le CV
      formattedCandidate.cvFileUrl = await storageService.getFileUrl(`cvs/${candidate.cvFile}`);

      // Générer des URL signées pour les documents supplémentaires
      for (let i = 0; i < formattedCandidate.documents.length; i++) {
        formattedCandidate.documents[i].url = await storageService.getFileUrl(formattedCandidate.documents[i].url);
      }
    } else {
      // En développement, utiliser des chemins relatifs
      formattedCandidate.cvFileUrl = `/uploads/cvs/${candidate.cvFile}`;
    }

    return respondWithSuccess(
      res,
      200,
      'Candidat récupéré avec succès',
      formattedCandidate
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération du candidat: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération du candidat', error.message);
  }
};

/**
 * Télécharge et analyse les CV pour créer des candidats
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const uploadAndAnalyzeCV = async (req, res) => {
  try {
    const { jobId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return respondWithError(res, 400, 'Aucun fichier reçu');
    }

    // Vérifier si l'offre existe
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      // Supprimer les fichiers téléchargés
      for (const file of files) {
        await unlinkAsync(file.path);
      }
      return respondWithError(res, 404, 'Offre d\'emploi non trouvée');
    }

    // Tableau pour stocker les résultats de l'analyse
    const results = [];

    // Traiter chaque fichier
    for (const file of files) {
      try {
        // Analyser le CV avec matching à l'offre
        console.log(`Tentative d'analyse du CV ${file.filename} pour l'offre ${jobId}`);
        const cvData = await cvParserService.parseCV(file.filename, job);
        console.log("hi ", cvData);
        
        // Créer le candidat dans la base de données
        const candidate = await prisma.candidate.create({
          data: {
            name: cvData.name,
            email: cvData.email || `${cvData.name.toLowerCase().replace(/ /g, '.')}@example.com`,
            phone: cvData.phone,
            location: cvData.location,
            jobId,
            matchingScore: cvData.matchingScore,
            skills: cvData.skills,
            experience: cvData.experience,
            education: cvData.education,
            workExperience: cvData.workExperience,
            languages: cvData.languages,
            status: 'new',
            cvFile: file.filename,
            lastActivity: new Date()
          }
        });

        // Ajouter le résultat
        results.push({
          success: true,
          candidateId: candidate.id,
          name: candidate.name,
          matchingScore: cvData.matchingScore
        });
      } catch (error) {
        
        logger.error(`Erreur lors de l'analyse du CV ${file.filename}: ${error.message}`);
        
        // Ajouter l'erreur au résultat
        results.push({
          success: false,
          filename: file.filename,
          error: error.message
        });

        
      }
    }

    return respondWithSuccess(
      res,
      201,
      'CVs analysés avec succès',
      { 
        totalProcessed: files.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
        results
      }
    );
  } catch (error) {
    logger.error(`Erreur lors de l'upload et l'analyse des CV: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de l\'upload et l\'analyse des CV', error.message);
  }
};

/**
 * Mise à jour du statut d'un candidat
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Vérifier si le statut est valide
    const validStatuses = ['new', 'toContact', 'interview', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return respondWithError(res, 400, 'Statut invalide');
    }

    // Vérifier si le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate) {
      return respondWithError(res, 404, 'Candidat non trouvé');
    }

    // Mettre à jour le statut et la date de dernière activité
    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: {
        status,
        lastActivity: new Date()
      }
    });

    return respondWithSuccess(
      res,
      200,
      'Statut du candidat mis à jour avec succès',
      updatedCandidate
    );
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du statut du candidat: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la mise à jour du statut', error.message);
  }
};

/**
 * Ajoute une note à un candidat
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const addCandidateNote = async (req, res) => {
  console.log("hhh hello");
   
  try {
    const { id } = req.params;
    const { content } = req.body;
 
    // Vérifier si le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });
   
    if (!candidate) {
      return respondWithError(res, 404, 'Candidat non trouvé');
    }

    // Créer la note
    const note = await prisma.note.create({
      data: {
        content,
        candidateId: id,
        userId: req.user.id 
      }
    });
    

    // Mettre à jour la date de dernière activité du candidat
    await prisma.candidate.update({
      where: { id },
      data: {
        lastActivity: new Date()
      }
    });

    return respondWithSuccess(
      res,
      201,
      'Note ajoutée avec succès',
      note
    );
  } catch (error) {
    logger.error(`Erreur lors de l'ajout de la note: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de l\'ajout de la note', error.message);
  }
};

/**
 * Supprime un candidat
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate) {
      return respondWithError(res, 404, 'Candidat non trouvé');
    }

    // Supprimer le fichier CV si en développement
    if (process.env.NODE_ENV !== 'production') {
      const filePath = path.join(__dirname, '..', 'uploads', 'cvs', candidate.cvFile);
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }
    } else {
      // En production, supprimer de S3
      await storageService.deleteFile(`cvs/${candidate.cvFile}`);
    }

    // Supprimer le candidat (les notes et documents seront supprimés en cascade)
    await prisma.candidate.delete({
      where: { id }
    });

    return respondWithSuccess(
      res,
      200,
      'Candidat supprimé avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la suppression du candidat: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la suppression du candidat', error.message);
  }
};

// Dans candidateController.js
/**
 * Effectue le matching d'un candidat avec une offre spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const matchCandidateWithJob = async (req, res) => {
  try {
    const { id, jobId } = req.params;

    // Vérifier si le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate) {
      return respondWithError(res, 404, 'Candidat non trouvé');
    }

    // Vérifier si l'offre existe
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return respondWithError(res, 404, 'Offre d\'emploi non trouvée');
    }

    // Effectuer le matching
    try {
      // Préparer les données pour l'API
      const jobOffer = {
        title: job.title,
        description: job.description,
        skills: job.skills || [],
        experience_level: job.experienceLevel
      };
      
      // Appel à l'API Python
      const response = await axios.post(
        `${process.env.AI_SERVICE_URL}/api/match/single/`,
        {
          job_offer: jobOffer,
          cv_file_key: candidate.cvFile
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000
        }
      );
      
      // Mettre à jour le score et d'autres informations pertinentes
      const updatedCandidate = await prisma.candidate.update({
        where: { id },
        data: {
          jobId, // Changer l'offre associée au candidat
          matchingScore: response.data.score,
          skills: response.data.skills || candidate.skills,
          lastActivity: new Date()
        }
      });
      
      return respondWithSuccess(
        res,
        200,
        'Matching effectué avec succès',
        {
          candidateId: candidate.id,
          jobId,
          matchingScore: response.data.score,
          summary: response.data.summary
        }
      );
    } catch (error) {
      logger.error(`Erreur lors du matching: ${error.message}`);
      return respondWithError(res, 500, 'Erreur lors du matching', error.message);
    }
  } catch (error) {
    logger.error(`Erreur lors du matching: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors du matching', error.message);
  }
};

module.exports = {
  getCandidates,
  getCandidateById,
  uploadAndAnalyzeCV,
  updateCandidateStatus,
  addCandidateNote,
  deleteCandidate,
  matchCandidateWithJob
};