const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { calculateMatchingScore } = require('../utils/helpers');

/**
 * Service de matching entre candidats et offres d'emploi
 */

/**
 * Calcule le score de matching pour un candidat et une offre d'emploi
 * @param {Object} candidate - Données du candidat
 * @param {Object} job - Données de l'offre d'emploi
 * @returns {Number} - Score de matching (0-100)
 */
const matchCandidateWithJob = (candidate, job) => {
  return calculateMatchingScore(candidate, job);
};

/**
 * Calcule et met à jour le score de matching d'un candidat pour une offre
 * @param {String} candidateId - ID du candidat
 * @param {String} jobId - ID de l'offre d'emploi
 * @returns {Object} - Candidat mis à jour avec score
 */
const updateCandidateMatchingScore = async (candidateId, jobId) => {
  try {
    // Récupérer le candidat et l'offre
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });
    
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!candidate || !job) {
      throw new Error('Candidat ou offre non trouvé');
    }
    
    // Calculer le score de matching
    const matchingScore = matchCandidateWithJob(candidate, job);
    
    // Mettre à jour le score dans la base de données
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: { matchingScore }
    });
    
    return updatedCandidate;
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du score de matching: ${error.message}`);
    throw new Error(`Erreur lors de la mise à jour du score de matching: ${error.message}`);
  }
};

/**
 * Calcule et met à jour les scores de matching pour tous les candidats d'une offre
 * @param {String} jobId - ID de l'offre d'emploi
 * @returns {Array} - Liste des candidats mis à jour avec scores
 */
const updateAllCandidatesForJob = async (jobId) => {
  try {
    // Récupérer l'offre
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      throw new Error('Offre non trouvée');
    }
    
    // Récupérer tous les candidats de cette offre
    const candidates = await prisma.candidate.findMany({
      where: { jobId }
    });
    
    // Mettre à jour les scores pour chaque candidat
    const updatedCandidates = [];
    for (const candidate of candidates) {
      const matchingScore = matchCandidateWithJob(candidate, job);
      
      const updated = await prisma.candidate.update({
        where: { id: candidate.id },
        data: { matchingScore }
      });
      
      updatedCandidates.push(updated);
    }
    
    return updatedCandidates;
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour des scores de matching: ${error.message}`);
    throw new Error(`Erreur lors de la mise à jour des scores de matching: ${error.message}`);
  }
};

/**
 * Trouve les meilleurs candidats pour une offre d'emploi
 * @param {String} jobId - ID de l'offre d'emploi
 * @param {Number} limit - Nombre maximum de candidats à retourner
 * @returns {Array} - Liste des meilleurs candidats triés par score
 */
const findBestCandidatesForJob = async (jobId, limit = 10) => {
  try {
    // Récupérer les candidats pour cette offre, triés par score
    const candidates = await prisma.candidate.findMany({
      where: { 
        jobId,
        // Exclure les candidats refusés
        status: { not: 'rejected' }
      },
      orderBy: { matchingScore: 'desc' },
      take: limit
    });
    
    return candidates;
  } catch (error) {
    logger.error(`Erreur lors de la recherche des meilleurs candidats: ${error.message}`);
    throw new Error(`Erreur lors de la recherche des meilleurs candidats: ${error.message}`);
  }
};

/**
 * Trouve les meilleures offres pour un candidat
 * @param {String} candidateId - ID du candidat
 * @param {Number} limit - Nombre maximum d'offres à retourner
 * @returns {Array} - Liste des meilleures offres pour ce candidat
 */
const findBestJobsForCandidate = async (candidateId, limit = 5) => {
  try {
    // Récupérer le candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });
    
    if (!candidate) {
      throw new Error('Candidat non trouvé');
    }
    
    // Récupérer toutes les offres actives
    const jobs = await prisma.job.findMany({
      where: { status: 'active' }
    });
    
    // Calculer le score pour chaque offre
    const scoredJobs = jobs.map(job => ({
      ...job,
      matchingScore: matchCandidateWithJob(candidate, job)
    }));
    
    // Trier par score descendant et limiter
    return scoredJobs
      .sort((a, b) => b.matchingScore - a.matchingScore)
      .slice(0, limit);
  } catch (error) {
    logger.error(`Erreur lors de la recherche des meilleures offres: ${error.message}`);
    throw new Error(`Erreur lors de la recherche des meilleures offres: ${error.message}`);
  }
};

/**
 * Recalcule les scores de matching suite à une modification d'une offre
 * @param {String} jobId - ID de l'offre d'emploi modifiée
 * @returns {Boolean} - Succès de l'opération
 */
const recalculateScoresAfterJobUpdate = async (jobId) => {
  try {
    // Mettre à jour tous les candidats de cette offre
    await updateAllCandidatesForJob(jobId);
    return true;
  } catch (error) {
    logger.error(`Erreur lors du recalcul des scores après mise à jour de l'offre: ${error.message}`);
    throw new Error(`Erreur lors du recalcul des scores: ${error.message}`);
  }
};

module.exports = {
  matchCandidateWithJob,
  updateCandidateMatchingScore,
  updateAllCandidatesForJob,
  findBestCandidatesForJob,
  findBestJobsForCandidate,
  recalculateScoresAfterJobUpdate
};