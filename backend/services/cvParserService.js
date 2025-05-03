const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const logger = require('../utils/logger');
const { extractCvInfo } = require('../utils/helpers');


/**
 * Service d'analyse de CV
 * Communique avec le microservice spaCy et le service de matching pour l'extraction d'informations
 */

// Configuration du service AI
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Analyse un fichier CV et extrait les informations pertinentes
 * @param {String} filePath - Chemin du fichier CV
 * @param {Object} jobData - Données de l'offre d'emploi (optionnel pour le matching)
 * @returns {Object} - Informations extraites du CV et score de matching
 */
const parseCV = async (filePath, jobData = null) => {
  try {
    // Chemin absolu en développement, clé S3 en production
    const fullPath = process.env.NODE_ENV === 'production' 
      ? filePath 
      : path.join(__dirname, '..', 'uploads', 'cvs', path.basename(filePath));
    
    // En développement, lire le fichier depuis le disque
    let fileBuffer;
    
    if (process.env.NODE_ENV !== 'production') {
      fileBuffer = await readFileAsync(fullPath);
    }
    
    // Préparer les données pour la requête
    const formData = new FormData();
    
    if (process.env.NODE_ENV === 'production') {
      // En production, envoyer la clé S3
      formData.append('file_key', filePath);
      formData.append('file_type', path.extname(filePath).substring(1));
    } else {
      // En développement, créer un Blob à partir du buffer
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      // Ou utiliser directement le fileBuffer si axios le supporte
      formData.append('file', blob, path.basename(fullPath));
    }

    console.log(`Preparing to send request to ${AI_SERVICE_URL}/api/analyze_cv/`);
    console.log(`File path: ${fullPath}`);
    console.log(`Job data provided: ${jobData ? 'Yes' : 'No'}`);
    
    // Si des données d'offre sont fournies, effectuer un matching
    let endpoint = `${AI_SERVICE_URL}/api/analyze_cv/`;
    
    if (jobData) {
      endpoint = `${AI_SERVICE_URL}/api/match/`;
      const jobOffer = {
        title: jobData.title,
        description: jobData.description,
        skills: jobData.skills || [],
        experience_level: jobData.experienceLevel
      };
      console.log(`Job offer data:`, jobOffer);
      formData.append('job_offer', JSON.stringify(jobOffer));
    }
    
    try {
      // Appeler le service d'analyse/matching
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 secondes
      });
      
      // Log de la réponse
      console.log(`Response status: ${response.status}`);
      console.log(`Response data:`, response.data);
      
      // Traitement normal de la réponse
      // ...
    } catch (requestError) {
      // Log détaillé de l'erreur
      console.error(`Error during API request:`, requestError);
      if (requestError.response) {
        console.error(`Response status:`, requestError.response.status);
        console.error(`Response data:`, requestError.response.data);
      }
      throw requestError;
    }
    
    
    if (response.status !== 200) {
      throw new Error(`Erreur d'analyse de CV: ${response.status} ${response.statusText}`);
    }
    
    // Traiter la réponse selon le type d'appel
    if (jobData) {
      // Cas de matching avec une offre
      const result = response.data.results[0]; // Prendre le premier résultat
      return {
        name: path.basename(filePath, path.extname(filePath)).replace(/_/g, ' '),
        email: '', // À compléter avec l'extraction d'email si disponible
        phone: '',
        location: '',
        skills: result.skills || [],
        experience: result.experience_years || 0,
        education: result.education || [],
        matchingScore: result.score,
        workExperience: [],
        languages: []
      };
    } else {
      // Cas d'analyse simple sans matching
      const result = response.data;
      
      // Convertir le résultat au format attendu par l'application
      return {
        name: path.basename(filePath, path.extname(filePath)).replace(/_/g, ' '),
        email: '', // À compléter avec l'extraction d'email si disponible
        phone: '',
        location: '',
        skills: result.skills || [],
        experience: result.experience_years || 0,
        education: result.education || [],
        matchingScore: 0, // Pas de score sans matching
        workExperience: [],
        languages: []
      };
    }
  } catch (error) {
    logger.error(`Erreur lors de l'analyse du CV: ${error.message}`);
    
    // Fallback: analyse simplifiée si le service est indisponible
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.warn('Utilisation de l\'analyse de secours');
      return performBackupParsing(filePath);
    }
    
    throw new Error(`Erreur lors de l'analyse du CV: ${error.message}`);
  }
};

// Le reste du service reste inchangé...

/**
 * Analyse de secours simplifiée en cas d'échec du service principal
 * @param {String} filePath - Chemin du fichier CV
 * @returns {Object} - Informations de base extraites du nom de fichier
 */
const performBackupParsing = (filePath) => {
  // Extraire le nom de fichier sans extension
  const filename = path.basename(filePath, path.extname(filePath));
  
  // Essayer d'extraire le nom à partir du nom de fichier
  // Format typique: NOM_Prénom_CV.pdf
  const parts = filename.split('_');
  let name = parts.length >= 2 ? `${parts[1]} ${parts[0]}` : filename;
  
  // Retourner un objet avec des valeurs par défaut
  return {
    name,
    email: '',
    phone: '',
    location: '',
    skills: [],
    experience: 0,
    education: [],
    workExperience: [],
    languages: []
  };
};

/**
 * Analyse un lot de CVs
 * @param {Array} filePaths - Liste des chemins de fichiers CV
 * @returns {Array} - Liste des résultats d'analyse
 */
const parseBatch = async (filePaths) => {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      const result = await parseCV(filePath);
      results.push({
        filePath,
        success: true,
        data: result
      });
    } catch (error) {
      results.push({
        filePath,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

module.exports = {
  parseCV,
  parseBatch
};