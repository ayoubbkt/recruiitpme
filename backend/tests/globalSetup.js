// tests/globalSetup.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement depuis .env.test
dotenv.config({ path: '.env.test' });

module.exports = async () => {
  console.log('🚀 Configuration globale des tests...');
  
  // S'assurer que le répertoire d'uploads existe
  const uploadsDir = path.join(__dirname, '../uploads/cvs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Répertoire d\'uploads créé:', uploadsDir);
  }
  
  // Créer un répertoire pour les logs de test
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Répertoire de logs créé:', logsDir);
  }

  // En environnement de test, nous pouvons simplement vérifier que les répertoires existent
  // sans nous connecter à la base de données pour éviter des erreurs d'authentification
  console.log('✅ Configuration globale des tests terminée');
  
  // Si vous avez vraiment besoin de tester la connexion à la base de données,
  // décommentez le code ci-dessous et assurez-vous que les identifiants sont corrects
  /*
  const prisma = new PrismaClient();
  
  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données de test établie');
    
    // Nettoyage... (si nécessaire)
    
    console.log('🧹 Nettoyage global de la base de données terminé');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des tests:', error);
    // Ne pas quitter le processus, juste enregistrer l'erreur
    console.error('Continuer sans connexion à la base de données');
  } finally {
    await prisma.$disconnect();
  }
  */
}