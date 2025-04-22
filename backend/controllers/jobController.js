const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { respondWithSuccess, respondWithError, createPagination } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const matchingService = require('../services/matchingService');

/**
 * Récupère toutes les offres d'emploi avec filtres et pagination
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Convertir page et limit en nombres
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Construire la clause where pour les filtres
    const where = {};
    
    // Filtre par statut si fourni
    if (status) {
      where.status = status;
    }

    // Filtre de recherche par titre ou lieu
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Récupérer le nombre total d'offres correspondant aux filtres
    const totalJobs = await prisma.job.count({ where });

    // Construire l'ordre de tri
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Récupérer les offres avec pagination
    const jobs = await prisma.job.findMany({
      where,
      orderBy,
      skip,
      take: limitInt,
      include: {
        // Compter le nombre de candidats par offre
        _count: {
          select: {
            candidates: true
          }
        }
      }
    });

    // Transformer les données pour inclure le nombre de candidats
    const jobsWithCandidatesCount = jobs.map(job => {
      // Grouper les candidats par statut
      const candidatesByStatus = {
        total: job._count.candidates
      };

      // Supprimer les données internes
      delete job._count;

      return {
        ...job,
        candidates: candidatesByStatus
      };
    });

    // Créer l'objet de pagination
    const pagination = createPagination(pageInt, limitInt, totalJobs);

    return respondWithSuccess(
      res,
      200,
      'Offres récupérées avec succès',
      jobsWithCandidatesCount,
      pagination
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des offres: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération des offres', error.message);
  }
};

/**
 * Récupère une offre d'emploi spécifique par ID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'offre avec le nombre de candidats par statut
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true
          }
        },
        candidates: {
          select: {
            status: true
          }
        }
      }
    });

    if (!job) {
      return respondWithError(res, 404, 'Offre non trouvée');
    }

    // Calculer le nombre de candidats par statut
    const statusCounts = {
      new: 0,
      toContact: 0,
      interview: 0,
      hired: 0,
      rejected: 0
    };

    job.candidates.forEach(candidate => {
      statusCounts[candidate.status] = (statusCounts[candidate.status] || 0) + 1;
    });

    // Transformer les données pour le format de réponse
    const formattedJob = {
      ...job,
      candidates: {
        total: job._count.candidates,
        byStatus: statusCounts
      }
    };

    // Supprimer les données internes
    delete formattedJob._count;
    delete formattedJob.candidates.candidates;

    return respondWithSuccess(
      res,
      200,
      'Offre récupérée avec succès',
      formattedJob
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'offre: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération de l\'offre', error.message);
  }
};

/**
 * Crée une nouvelle offre d'emploi
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const createJob = async (req, res) => {
  try {
    const {
      title,
      location,
      contractType,
      salary,
      experienceLevel,
      startDate,
      languages,
      description,
      skills,
      pipelineStages,
      status = 'active' // Valeur par défaut si non fournie
    } = req.body;

    // Validation des champs obligatoires
    if (!title || !location || !contractType || !experienceLevel || !description) {
      return respondWithError(res, 400, 'Tous les champs obligatoires doivent être remplis');
    }

    // Validation des skills comme tableau
    if (!Array.isArray(skills) || skills.length === 0) {
      return respondWithError(res, 400, 'Veuillez fournir au moins une compétence requise');
    }

    // Validation des pipelineStages comme tableau
    if (!Array.isArray(pipelineStages) || pipelineStages.length === 0) {
      return respondWithError(res, 400, 'Veuillez fournir au moins une étape de pipeline');
    }

    // Création de l'offre dans la base de données
    const job = await prisma.job.create({
      data: {
        title,
        location,
        contractType,
        salary,
        experienceLevel,
        startDate: startDate ? new Date(startDate) : null,
        languages,
        description,
        skills,
        pipelineStages,
        status
      }
    });

    return respondWithSuccess(
      res,
      201,
      'Offre créée avec succès',
      job
    );
  } catch (error) {
    logger.error(`Erreur lors de la création de l'offre: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la création de l\'offre', error.message);
  }
};

/**
 * Met à jour une offre d'emploi existante
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      location,
      contractType,
      salary,
      experienceLevel,
      startDate,
      languages,
      description,
      skills,
      pipelineStages,
      status
    } = req.body;

    // Vérifier si l'offre existe
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return respondWithError(res, 404, 'Offre non trouvée');
    }

    // Mise à jour de l'offre
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title,
        location,
        contractType,
        salary,
        experienceLevel,
        startDate: startDate ? new Date(startDate) : null,
        languages,
        description,
        skills,
        pipelineStages,
        status
      }
    });

    // Si les critères de matching ont changé, recalculer les scores
    if (
      existingJob.skills.join(',') !== skills.join(',') ||
      existingJob.experienceLevel !== experienceLevel ||
      existingJob.languages !== languages
    ) {
      // Déclencher le recalcul de façon asynchrone sans bloquer la réponse
      matchingService.recalculateScoresAfterJobUpdate(id)
        .catch(error => {
          logger.error(`Erreur lors du recalcul des scores de matching: ${error.message}`);
        });
    }

    return respondWithSuccess(
      res,
      200,
      'Offre mise à jour avec succès',
      updatedJob
    );
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'offre: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la mise à jour de l\'offre', error.message);
  }
};

/**
 * Supprime une offre d'emploi
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'offre existe
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return respondWithError(res, 404, 'Offre non trouvée');
    }

    // Vérifier si des candidats sont liés à cette offre
    const candidatesCount = await prisma.candidate.count({
      where: { jobId: id }
    });

    // Supprimer l'offre (les candidats associés seront supprimés en cascade)
    await prisma.job.delete({
      where: { id }
    });

    let message = 'Offre supprimée avec succès';
    if (candidatesCount > 0) {
      message += ` ainsi que ${candidatesCount} candidat(s) associé(s)`;
    }

    return respondWithSuccess(
      res,
      200,
      message
    );
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'offre: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la suppression de l\'offre', error.message);
  }
};

/**
 * Trouve les meilleurs candidats pour une offre
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getBestCandidatesForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // Vérifier si l'offre existe
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return respondWithError(res, 404, 'Offre non trouvée');
    }

    // Trouver les meilleurs candidats
    const candidates = await matchingService.findBestCandidatesForJob(id, parseInt(limit));

    return respondWithSuccess(
      res,
      200,
      'Meilleurs candidats récupérés avec succès',
      candidates
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des meilleurs candidats: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération des meilleurs candidats', error.message);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getBestCandidatesForJob
};