const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

// Protéger toutes les routes avec authentification
router.use(authenticate);

// Récupérer les statistiques du tableau de bord
router.get('/dashboard', analyticsController.getDashboardStats);

// Récupérer les statistiques pour une offre spécifique
router.get('/jobs/:id', analyticsController.getJobStats);

// Récupérer les taux de conversion du processus de recrutement
router.get('/conversion', analyticsController.getConversionStats);

// Générer un rapport complet
router.get('/reports', analyticsController.generateReport);

module.exports = router;