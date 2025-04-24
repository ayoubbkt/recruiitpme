const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { respondWithSuccess, respondWithError, createPagination } = require('../utils/apiResponse');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Récupère tous les entretiens avec filtres et pagination
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getInterviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      upcoming,
      past,
      status,
      candidateId,
      jobId
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

    // Filtre par candidat si fourni
    if (candidateId) {
      where.candidateId = candidateId;
    }

    // Filtre par offre si fourni
    if (jobId) {
      where.jobId = jobId;
    }

    // Filtre par date (à venir / passé)
    const now = new Date();
    if (upcoming === 'true') {
      where.date = { gte: now };
    } else if (past === 'true') {
      where.date = { lt: now };
    }

    // Filtre de recherche par nom du candidat ou interviewer
    if (search) {
      where.OR = [
        { 
          candidate: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        { interviewer: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Récupérer le nombre total d'entretiens correspondant aux filtres
    const totalInterviews = await prisma.interview.count({ where });

    // Récupérer les entretiens avec pagination
    const interviews = await prisma.interview.findMany({
      where,
      orderBy: { date: upcoming === 'true' ? 'asc' : 'desc' },
      skip,
      take: limitInt,
      include: {
        candidate: {
          select: {
            name: true,
            email: true
          }
        },
        job: {
          select: {
            title: true
          }
        }
      }
    });

    // Formater les entretiens pour la réponse
    const formattedInterviews = interviews.map(interview => {
      const { candidate, job, ...interviewData } = interview;
      return {
        ...interviewData,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        jobTitle: job.title
      };
    });

    // Créer l'objet de pagination
    const pagination = createPagination(pageInt, limitInt, totalInterviews);

    return respondWithSuccess(
      res,
      200,
      'Entretiens récupérés avec succès',
      formattedInterviews,
      pagination
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des entretiens: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération des entretiens', error.message);
  }
};

/**
 * Récupère un entretien spécifique par ID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true
          }
        }
      }
    });

    if (!interview) {
      return respondWithError(res, 404, 'Entretien non trouvé');
    }

    // Formater l'entretien pour la réponse
    const { candidate, job, ...interviewData } = interview;
    const formattedInterview = {
      ...interviewData,
      candidate,
      job
    };

    return respondWithSuccess(
      res,
      200,
      'Entretien récupéré avec succès',
      formattedInterview
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'entretien: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération de l\'entretien', error.message);
  }
};

/**
 * Crée un nouvel entretien
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const createInterview = async (req, res) => {
  try {
    const { 
      candidateId, 
      date, 
      time, 
      interviewer, 
      videoLink, 
      notes,
      sendEmail = false
    } = req.body;

    // Validation des champs obligatoires
    if (!candidateId || !date || !time || !interviewer) {
      return respondWithError(res, 400, 'Tous les champs obligatoires doivent être remplis');
    }

    // Vérifier si le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        job: true
      }
    });

    if (!candidate) {
      return respondWithError(res, 404, 'Candidat non trouvé');
    }

    // Vérifier si la date est valide (pas dans le passé)
    const interviewDate = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (interviewDate < now) {
      return respondWithError(res, 400, 'La date et l\'heure de l\'entretien ne peuvent pas être dans le passé');
    }

    // Créer l'entretien
    const interview = await prisma.interview.create({
      data: {
        candidateId,
        jobId: candidate.jobId,
        date: interviewDate,
        time,
        interviewer,
        videoLink,
        notes,
        status: 'scheduled',
        interviewerId: req.user.id// Associer l'entretien à l'utilisateur connecté si disponible
      }
    });

    // Mettre à jour le statut du candidat si nécessaire
    if (candidate.status === 'new' || candidate.status === 'toContact') {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          status: 'interview',
          lastActivity: new Date()
        }
      });
    }

    // Envoyer un email au candidat si demandé
    if (sendEmail) {
      try {
        await emailService.sendInterviewInvitation(candidate, interview, candidate.job);
      } catch (emailError) {
        logger.error(`Erreur lors de l'envoi de l'email d'invitation: ${emailError.message}`);
        // Continuer malgré l'erreur d'email, l'entretien est toujours créé
      }
    }

    return respondWithSuccess(
      res,
      201,
      'Entretien créé avec succès',
      interview
    );
  } catch (error) {
    logger.error(`Erreur lors de la création de l'entretien: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la création de l\'entretien', error.message);
  }
};

/**
 * Met à jour un entretien existant
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      date, 
      time, 
      interviewer, 
      videoLink, 
      notes,
      status,
      feedback,
      sendEmail = false
    } = req.body;

    // Vérifier si l'entretien existe
    const existingInterview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: true,
        job: true
      }
    });

    if (!existingInterview) {
      return respondWithError(res, 404, 'Entretien non trouvé');
    }

    // Préparer les données de mise à jour
    const updateData = {};
    
    if (date && time) {
      const interviewDate = new Date(`${date}T${time}`);
      updateData.date = interviewDate;
    } else if (date) {
      const originalTime = existingInterview.time;
      const interviewDate = new Date(`${date}T${originalTime}`);
      updateData.date = interviewDate;
    }
    
    if (time) updateData.time = time;
    if (interviewer) updateData.interviewer = interviewer;
    if (videoLink !== undefined) updateData.videoLink = videoLink;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (feedback !== undefined) updateData.feedback = feedback;

    // Mise à jour de l'entretien
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: updateData
    });

    // Mettre à jour le statut du candidat si l'entretien est marqué comme terminé
    if (status === 'completed' && existingInterview.candidate.status === 'interview') {
      await prisma.candidate.update({
        where: { id: existingInterview.candidate.id },
        data: {
          lastActivity: new Date()
          // Ne pas changer le statut automatiquement après l'entretien
        }
      });
    }

    // Si le statut est "noShow", mettre à jour le candidat
    if (status === 'noShow' && existingInterview.candidate.status === 'interview') {
      await prisma.candidate.update({
        where: { id: existingInterview.candidate.id },
        data: {
          lastActivity: new Date()
          // Ne pas changer le statut automatiquement
        }
      });
    }

    // Envoyer un email au candidat si demandé et si la date/heure a changé
    if (sendEmail && (date || time) && status !== 'canceled') {
      try {
        await emailService.sendInterviewInvitation(
          existingInterview.candidate, 
          updatedInterview, 
          existingInterview.job
        );
      } catch (emailError) {
        logger.error(`Erreur lors de l'envoi de l'email de mise à jour: ${emailError.message}`);
        // Continuer malgré l'erreur d'email, l'entretien est toujours mis à jour
      }
    }

    return respondWithSuccess(
      res,
      200,
      'Entretien mis à jour avec succès',
      updatedInterview
    );
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'entretien: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la mise à jour de l\'entretien', error.message);
  }
};

/**
 * Supprime un entretien
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'entretien existe
    const existingInterview = await prisma.interview.findUnique({
      where: { id }
    });

    if (!existingInterview) {
      return respondWithError(res, 404, 'Entretien non trouvé');
    }

    // Supprimer l'entretien
    await prisma.interview.delete({
      where: { id }
    });

    return respondWithSuccess(
      res,
      200,
      'Entretien supprimé avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'entretien: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la suppression de l\'entretien', error.message);
  }
};

/**
 * Ajoute un compte-rendu à un entretien
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const addInterviewFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    // Vérifier si l'entretien existe
    const existingInterview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: true
      }
    });

    if (!existingInterview) {
      return respondWithError(res, 404, 'Entretien non trouvé');
    }

    // Vérifier si l'entretien peut recevoir un compte-rendu
    if (existingInterview.status !== 'completed') {
      // Mettre à jour le statut en même temps
      const updatedInterview = await prisma.interview.update({
        where: { id },
        data: {
          feedback,
          status: 'completed'
        }
      });

      return respondWithSuccess(
        res,
        200,
        'Compte-rendu ajouté et statut mis à jour avec succès',
        updatedInterview
      );
    }

    // Mise à jour du compte-rendu uniquement
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: { feedback }
    });

    return respondWithSuccess(
      res,
      200,
      'Compte-rendu ajouté avec succès',
      updatedInterview
    );
  } catch (error) {
    logger.error(`Erreur lors de l'ajout du compte-rendu: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de l\'ajout du compte-rendu', error.message);
  }
};

module.exports = {
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  addInterviewFeedback
};