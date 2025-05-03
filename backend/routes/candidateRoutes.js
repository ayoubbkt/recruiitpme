const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authenticate } = require('../middleware/auth');
const { uploadCV, handleUploadError } = require('../middleware/upload');
const Joi = require('joi');
const { validate } = require('../middleware/validation');

// Schémas de validation
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'toContact', 'interview', 'hired', 'rejected').required()
});

const noteSchema = Joi.object({
  text: Joi.string().required().min(3).max(1000)
});

// Routes publiques - aucune

// Routes protégées par authentification
router.use(authenticate);

// Récupérer tous les candidats (avec filtres et pagination)
router.get('/', candidateController.getCandidates);

// Récupérer un candidat par son ID
router.get('/:id', candidateController.getCandidateById);

// Upload et analyse des CV
router.post(
  '/upload',
  (req, res, next) => {
    console.log('Route /upload appelée');
    next();
  },
  uploadCV.array('files', 10),
  (req, res, next) => {
    console.log('Après uploadCV middleware');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files || 'Aucun fichier reçu');
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier reçu',
      });
    }
    next();
  },
  handleUploadError,
  candidateController.uploadAndAnalyzeCV
);



// Mettre à jour le statut d'un candidat
router.post(
  '/:id/status', 
  validate(updateStatusSchema), 
  candidateController.updateCandidateStatus
);

// Ajouter une note à un candidat
router.post(
  '/:id/notes', 
  validate(noteSchema), 
  candidateController.addCandidateNote
);

// Supprimer un candidat
router.delete('/:id', candidateController.deleteCandidate);
router.post(
  '/:id/match/:jobId',
  authenticate,
  candidateController.matchCandidateWithJob
);

module.exports = router;