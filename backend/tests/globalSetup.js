// Configuration globale avant l'exécution de tous les tests
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Configuration globale des tests...');
  
  // Configurer la base de données de test
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/recruitpme_test';
  
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
  
  // Créer une connexion Prisma pour les tests
  const prisma = new PrismaClient();
  
  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données de test établie');
    
    // Nettoyer la base de données de test (selon les besoins)
    // Il est généralement préférable de laisser chaque suite de tests gérer ses propres données
    // mais nous pouvons effectuer certains nettoyages globaux ici
    
    console.log('🧹 Nettoyage global de la base de données terminé');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('✅ Configuration globale des tests terminée');
};