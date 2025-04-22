const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const logger = require('../utils/logger');
const { extractCvInfo } = require('../utils/helpers');

/**
 * Service d'analyse de CV
 * Communique avec le microservice spaCy pour l'extraction d'informations
 */

/**
 * Analyse un fichier CV et extrait les informations pertinentes
 * @param {String} filePath - Chemin du fichier CV
 * @returns {Object} - Informations extraites du CV
 */
const parseCV = async (filePath) => {
  try {
    // Chemin absolu en développement, clé S3 en production
    const fullPath = process.env.NODE_ENV === 'production' 
      ? filePath 
      : path.join(__dirname, '..', 'uploads', 'cvs', path.basename(filePath));
    
    // En développement, lire le fichier depuis le disque
    let fileContent;
    let fileBuffer;
    
    if (process.env.NODE_ENV !== 'production') {
      fileBuffer = await readFileAsync(fullPath);
    }
    
    // Préparer la requête pour le microservice
    const payload = process.env.NODE_ENV === 'production'
      ? { 
          file_key: filePath, 
          file_type: path.extname(filePath).substring(1) // sans le point
        }
      : { 
          file_content: fileBuffer.toString('base64'),
          file_type: path.extname(fullPath).substring(1),
          file_name: path.basename(fullPath)
        };
    
    // Appeler le microservice d'analyse de CV
    const response = await axios.post(process.env.CV_PARSER_SERVICE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 secondes
    });
    
    if (response.status !== 200) {
      throw new Error(`Erreur d'analyse de CV: ${response.status} ${response.statusText}`);
    }
    
    // Extraire et nettoyer les données
    return extractCvInfo(response.data);
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