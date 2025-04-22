const crypto = require('crypto');
const path = require('path');

/**
 * Génère un token aléatoire
 * @param {Number} size - Taille du token en bytes
 * @returns {String} - Token aléatoire en hexadécimal
 */
const generateToken = (size = 32) => {
  return crypto.randomBytes(size).toString('hex');
};

/**
 * Calcule le nombre de jours entre deux dates
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin (défaut: maintenant)
 * @returns {Number} - Nombre de jours
 */
const daysBetweenDates = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Obtient l'URL complète du fichier CV (S3 ou local)
 * @param {String} fileName - Nom du fichier
 * @returns {String} - URL complète
 */
const getCvFileUrl = (fileName) => {
  if (process.env.NODE_ENV === 'production') {
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/cvs/${fileName}`;
  } else {
    // En développement, renvoie un chemin relatif
    return `/uploads/cvs/${fileName}`;
  }
};

/**
 * Extraire les informations pertinentes d'un CV au format standard
 * @param {Object} cvData - Données brutes du CV 
 * @returns {Object} - Données structurées
 */
const extractCvInfo = (cvData) => {
  // Initialiser les valeurs par défaut
  const result = {
    name: cvData.name || '',
    email: cvData.email || '',
    phone: cvData.phone || '',
    location: cvData.location || '',
    skills: Array.isArray(cvData.skills) ? cvData.skills : [],
    experience: cvData.experience || 0,
    education: Array.isArray(cvData.education) ? cvData.education : [],
    workExperience: Array.isArray(cvData.workExperience) ? cvData.workExperience : [],
    languages: Array.isArray(cvData.languages) ? cvData.languages : []
  };

  return result;
};

/**
 * Calcule un score de matching entre un candidat et une offre d'emploi
 * @param {Object} candidate - Données du candidat
 * @param {Object} job - Données de l'offre d'emploi
 * @returns {Number} - Score de matching (0-100)
 */
const calculateMatchingScore = (candidate, job) => {
  let score = 0;
  let maxScore = 0;
  
  // Matching des compétences (60% du score total)
  const skillsWeight = 60;
  maxScore += skillsWeight;
  
  if (job.skills && job.skills.length > 0 && candidate.skills && candidate.skills.length > 0) {
    // Convertir en minuscules pour une comparaison insensible à la casse
    const jobSkills = job.skills.map(skill => skill.toLowerCase());
    const candidateSkills = candidate.skills.map(skill => skill.toLowerCase());
    
    // Compter combien de compétences requises le candidat possède
    let matchedSkills = 0;
    jobSkills.forEach(skill => {
      if (candidateSkills.some(candidateSkill => candidateSkill.includes(skill) || skill.includes(candidateSkill))) {
        matchedSkills++;
      }
    });
    
    // Calculer le pourcentage de compétences correspondantes
    const skillsScore = jobSkills.length > 0 ? (matchedSkills / jobSkills.length) * skillsWeight : 0;
    score += skillsScore;
  }
  
  // Matching de l'expérience (30% du score total)
  const experienceWeight = 30;
  maxScore += experienceWeight;
  
  if (job.experienceLevel && candidate.experience) {
    // Attribuer des valeurs numériques aux niveaux d'expérience
    const experienceLevels = {
      junior: 1,
      intermediate: 3,
      senior: 5
    };
    
    const requiredExperience = experienceLevels[job.experienceLevel] || 0;
    
    // Si l'expérience du candidat est >= à celle requise, score complet
    // Sinon, score proportionnel
    if (candidate.experience >= requiredExperience) {
      score += experienceWeight;
    } else {
      score += (candidate.experience / requiredExperience) * experienceWeight;
    }
  }
  
  // Matching des langues (10% du score total)
  const languagesWeight = 10;
  maxScore += languagesWeight;
  
  if (job.languages && candidate.languages && candidate.languages.length > 0) {
    const jobLanguages = job.languages.toLowerCase().split(',').map(lang => lang.trim());
    const candidateLanguages = candidate.languages.map(lang => lang.toLowerCase());
    
    let matchedLanguages = 0;
    jobLanguages.forEach(lang => {
      if (candidateLanguages.some(candidateLang => candidateLang.includes(lang) || lang.includes(candidateLang))) {
        matchedLanguages++;
      }
    });
    
    const languagesScore = jobLanguages.length > 0 ? (matchedLanguages / jobLanguages.length) * languagesWeight : 0;
    score += languagesScore;
  } else {
    // Si pas de langues spécifiées, donner le score complet
    score += languagesWeight;
  }
  
  // Normaliser le score sur 100
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

module.exports = {
  generateToken,
  daysBetweenDates,
  getCvFileUrl,
  extractCvInfo,
  calculateMatchingScore
};