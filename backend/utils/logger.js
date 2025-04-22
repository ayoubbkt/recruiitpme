const winston = require('winston');
const path = require('path');

// Définir les niveaux et couleurs
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Ajouter les couleurs à winston
winston.addColors(colors);

// Format personnalisé pour les logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Format personnalisé pour la console avec coloration
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
  )
);

// Définir les transports de logs
const transports = [
  // Log dans la console avec coloration
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      consoleFormat
    ),
  }),
];

// Ajouter des logs de fichiers en production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Logs d'erreur dans un fichier séparé
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
    }),
    // Tous les logs combinés
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    })
  );
}

// Créer l'instance de logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
});

module.exports = logger;