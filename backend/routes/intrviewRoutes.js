const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { authenticate } = require('../middleware/auth');
const Joi = require('joi');
const { validate } = require('../middleware/validation');

// Schémas de validation
const createInterviewSchema = Joi.object({
  candidateId: Joi.string().required(),
  date: Joi.string().required(), // Format YYYY-MM-DD
  time: Joi.string().required().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // Format HH:MM
  interviewer: Joi.string().required(),
  videoLink: Joi.string().uri().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  sendEmail: Joi.boolean().default(false)
});

const updateInterviewSchema = Joi.object({
  date: Joi.string().optional(), // Format YYYY-MM-DD
  time: Joi.string().optional().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // Format HH:MM
  interviewer: Joi.string().optional(),
  videoLink: Joi.string().uri().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('scheduled', 'completed', 'canceled', 'noShow').optional(),
  feedback: Joi.string().allow('', null).optional(),
  sendEmail: Joi.boolean().default(false)
});

const feedbackSchema = Joi.object({
  feedback: Joi.string().required().min(10)
});

// Protéger toutes les routes avec authentification
router.use(authenticate);

// Récupérer tous les entretiens (avec filtres et pagination)
router.get('/', interviewController.getInterviews);

// Récupérer un entretien par son ID
router.get('/:id', interviewController.getInterviewById);

// Créer un nouvel entretien
router.post('/', validate(createInterviewSchema), interviewController.createInterview);

// Mettre à jour un entretien
router.put('/:id', validate(updateInterviewSchema), interviewController.updateInterview);

// Supprimer un entretien
router.delete('/:id', interviewController.deleteInterview);

// Ajouter un compte-rendu à un entretien
router.post('/:id/feedback', validate(feedbackSchema), interviewController.addInterviewFeedback);

module.exports = router;