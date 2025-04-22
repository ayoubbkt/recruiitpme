require('dotenv').config();
const app = require('./app');
const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Fonction pour vérifier la connexion à la base de données
async function testDatabaseConnection() {
  try {
    // Exécuter une requête simple
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Connexion à la base de données réussie');
    return true;
  } catch (error) {
    logger.error(`Erreur de connexion à la base de données: ${error.message}`);
    return false;
  }
}

// Démarrer le serveur
async function startServer() {
  try {
    // Vérifier la connexion à la base de données
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      logger.error('Impossible de démarrer le serveur: échec de la connexion à la base de données');
      process.exit(1);
    }
    
    // Démarrer le serveur Express
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Erreur lors du démarrage du serveur: ${error.message}`);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Démarrer le serveur
startServer();

// Nettoyage avant la fermeture du serveur
process.on('SIGINT', async () => {
  logger.info('Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});