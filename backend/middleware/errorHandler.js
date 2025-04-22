const logger = require('../utils/logger');

/**
 * Middleware de gestion globale des erreurs
 * Capture toutes les erreurs non gérées dans l'application
 */
const errorHandler = (err, req, res, next) => {
  // Log l'erreur avec Winston
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500
  });

  // Déterminer le code d'état de la réponse
  const statusCode = err.statusCode || 500;
  
  // Formater la réponse d'erreur en fonction de l'environnement
  const errorResponse = {
    success: false,
    message: statusCode === 500 
      ? process.env.NODE_ENV === 'production' 
        ? 'Erreur serveur interne'
        : err.message
      : err.message,
  };

  // Ajouter la stack trace en développement uniquement
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;