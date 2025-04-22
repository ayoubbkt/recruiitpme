const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Schéma de validation pour la création/mise à jour d'offre
const jobSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'Le titre est requis',
    'any.required': 'Le titre est requis'
  }),
  location: Joi.string().required().messages({
    'string.empty': 'Le lieu est requis',
    'any.required': 'Le lieu est requis'
  }),
  contractType: Joi.string().required().valid('cdi', 'cdd', 'internship', 'freelance', 'apprenticeship').messages({
    'string.empty': 'Le type de contrat est requis',
    'any.required': 'Le type de contrat est requis',
    'any.only': 'Type de contrat invalide'
  }),
  salary: Joi.string().allow('', null),
  experienceLevel: Joi.string().required().valid('junior', 'intermediate', 'senior').messages({
    'string.empty': 'Le niveau d\'expérience est requis',
    'any.required': 'Le niveau d\'expérience est requis',
    'any.only': 'Niveau d\'expérience invalide'
  }),
  startDate: Joi.date().iso().allow('', null),
  languages: Joi.string().allow('', null),
  description: Joi.string().required().messages({
    'string.empty': 'La description est requise',
    'any.required': 'La description est requise'
  }),
  skills: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'Au moins une compétence est requise',
    'array.base': 'Les compétences doivent être un tableau',
    'any.required': 'Les compétences sont requises'
  }),
  pipelineStages: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'Au moins une étape de pipeline est requise',
    'array.base': 'Les étapes doivent être un tableau',
    'any.required': 'Les étapes de pipeline sont requises'
  }),
  status: Joi.string().valid('active', 'draft', 'closed').default('active')
});

// Schéma pour les paramètres de recherche
const jobQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'draft', 'closed').allow('', null),
  sortBy: Joi.string().valid('createdAt', 'title', 'location').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Routes pour les offres d'emploi (toutes protégées par authentification)
router.get('/', authenticate, validate(jobQuerySchema, 'query'), jobController.getJobs);
router.post('/', authenticate, validate(jobSchema), jobController.createJob);
router.get('/:id', authenticate, jobController.getJobById);
router.put('/:id', authenticate, validate(jobSchema), jobController.updateJob);
router.delete('/:id', authenticate, jobController.deleteJob);

// Route pour récupérer les meilleurs candidats pour une offre
router.get('/:id/match', authenticate, jobController.getBestCandidatesForJob);

module.exports = router;