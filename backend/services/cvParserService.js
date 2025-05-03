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
    
    // Première étape : Analyser le CV
    const analyzeFormData = new FormData();
    
    if (process.env.NODE_ENV === 'production') {
      analyzeFormData.append('file_key', filePath);
    } else {
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      analyzeFormData.append('file', blob, path.basename(fullPath));
    }

    console.log(`Preparing to send request to ${AI_SERVICE_URL}/api/analyze_cv/`);
    console.log(`File path: ${fullPath}`);
    console.log(`Job data provided: ${jobData ? 'Yes' : 'No'}`);
    
    try {
      // Étape 1: Appeler le service d'analyse de CV
      const analyzeResponse = await axios.post(
        `${AI_SERVICE_URL}/api/analyze_cv/`,
        analyzeFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );
      
      console.log(`Response status: ${analyzeResponse.status}`);
      console.log(`Response data:`, analyzeResponse.data);
      
      // Si l'analyse a réussi et qu'aucune donnée d'offre n'est fournie, retourner directement les résultats
      if (!jobData) {
        const result = analyzeResponse.data;
        return {
          name: path.basename(filePath, path.extname(filePath)).replace(/_/g, ' '),
          email: '',
          phone: '',
          location: '',
          skills: result.skills || [],
          experience: result.experience_years || 0,
          education: Array.isArray(result.education) ? result.education : [],
          matchingScore: 0,
          workExperience: [],
          languages: []
        };
      }
      
      // À ce stade, nous avons réussi à analyser le CV, mais nous devons maintenant calculer un score de matching
      
      // Fonction locale pour calculer le score de matching
      const calculateMatchingScore = (candidateSkills, jobSkills, candidateExperience, jobExperienceLevel) => {
        let score = 0;
        
        // 1. Matching des compétences (60% du score)
        const skillsWeight = 60;
        if (jobSkills && jobSkills.length > 0 && candidateSkills && candidateSkills.length > 0) {
          // Convertir en minuscules
          const normalizedJobSkills = jobSkills.map(s => s.toLowerCase());
          const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase());
          
          // Compter les compétences correspondantes
          let matchedSkills = 0;
          normalizedJobSkills.forEach(jobSkill => {
            if (normalizedCandidateSkills.some(candidateSkill => 
                candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill))) {
              matchedSkills++;
            }
          });
          
          // Calculer le score des compétences
          score += (matchedSkills / normalizedJobSkills.length) * skillsWeight;
        }
        
        // 2. Matching de l'expérience (40% du score)
        const experienceWeight = 40;
        const experienceLevels = {
          'junior': 0,
          'intermediate': 3,
          'senior': 5
        };
        
        const requiredExperience = experienceLevels[jobExperienceLevel] || 3;
        
        if (candidateExperience >= requiredExperience) {
          score += experienceWeight;
        } else if (candidateExperience > 0) {
          score += (candidateExperience / requiredExperience) * experienceWeight;
        }
        
        // Normaliser le score sur 100
        return Math.round(score);
      };
      
      // Extraire les données pertinentes du CV analysé
      const candidateSkills = analyzeResponse.data.skills || [];
      const candidateExperience = analyzeResponse.data.experience_years || 0;
      
      // Calculer le score de matching
      const matchingScore = calculateMatchingScore(
        candidateSkills,
        jobData.skills || [],
        candidateExperience,
        jobData.experienceLevel || 'intermediate'
      );
      
      return {
        name: path.basename(filePath, path.extname(filePath)).replace(/_/g, ' '),
        email: '',
        phone: '',
        location: '',
        skills: candidateSkills,
        experience: candidateExperience,
        education: Array.isArray(analyzeResponse.data.education) ? analyzeResponse.data.education : [],
        matchingScore: matchingScore,
        workExperience: [],
        languages: []
      };
      
    } catch (requestError) {
      console.error(`Error during API request:`, requestError);
      if (requestError.response) {
        console.error(`Response status:`, requestError.response.status);
        console.error(`Response data:`, requestError.response.data);
      }
      throw requestError;
    }
    
  } catch (error) {
    logger.error(`Erreur lors de l'analyse du CV: ${error.message}`);
    
    // Fallback: analyse simplifiée si le service est indisponible
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.warn('Utilisation de l\'analyse de secours');
      
      // Analyse de secours basique
      const fallbackResult = performBackupParsing(filePath);
      
      // Si des données d'offre sont fournies, attribuer un score par défaut
      if (jobData) {
        fallbackResult.matchingScore = 50; // Score par défaut moyen
      }
      
      return fallbackResult;
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