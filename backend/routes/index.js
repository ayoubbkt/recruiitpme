const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const candidateRoutes = require('./candidateRoutes');
const interviewRoutes = require('./interviewRoutes');
const analyticsRoutes = require('./analyticsRoutes');

// Route de base pour vérifier que l'API est en ligne
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API RecrutPME en ligne',
    version: '1.0.0'
  });
});

// Monter les différentes routes
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidates', candidateRoutes);
router.use('/interviews', interviewRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;