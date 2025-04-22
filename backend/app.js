const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Créer l'application Express
const app = express();

// Configuration de base
app.use(helmet()); // Sécurité HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: false })); // Parser URL-encoded
app.use(compression()); // Compression gzip

// Logging des requêtes HTTP
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting pour prévenir les abus
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true, // Retourne les info rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  skip: (req) => process.env.NODE_ENV === 'development' // Désactiver en développement
});
app.use(limiter);

// Servir les fichiers statiques en développement
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes API
app.use('/api', routes);

// Gestion des 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion des erreurs globales
app.use(errorHandler);

module.exports = app;