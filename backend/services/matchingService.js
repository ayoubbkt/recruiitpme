// services/matchingService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { calculateMatchingScore } = require('../utils/helpers');

// Définir les méthodes encapsulées dans un objet
const matchingService = {
  /**
   * Calcule le score de matching pour un candidat et une offre d'emploi
   */
  matchCandidateWithJob(candidate, job) {
    return calculateMatchingScore(candidate, job);
  },

  /**
   * Calcule et met à jour le score de matching d'un candidat pour une offre
   */
  async updateCandidateMatchingScore(candidateId, jobId) {
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
      const matchingScore = this.matchCandidateWithJob(candidate, job);
      
      // Mettre à jour le score dans la base de données
      const updatedCandidate = await prisma.candidate.update({
        where: { id: candidateId },
        data: { matchingScore }
      });
      
      return updatedCandidate;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du score de matching: ${error.message}`);
      throw error;
    }
  },

  /**
   * Calcule et met à jour les scores de matching pour tous les candidats d'une offre
   */
  async updateAllCandidatesForJob(jobId) {
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
        const matchingScore = this.matchCandidateWithJob(candidate, job);
        
        const updated = await prisma.candidate.update({
          where: { id: candidate.id },
          data: { matchingScore }
        });
        
        updatedCandidates.push(updated);
      }
      
      return updatedCandidates;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour des scores de matching: ${error.message}`);
      throw error;
    }
  },

  /**
   * Trouve les meilleurs candidats pour une offre d'emploi
   */
  async findBestCandidatesForJob(jobId, limit = 10) {
    try {
      // Récupérer les candidats pour cette offre, triés par score
      const candidates = await prisma.candidate.findMany({
        where: { 
          jobId,
          status: { not: 'rejected' }
        },
        orderBy: { matchingScore: 'desc' },
        take: limit
      });
      
      return candidates;
    } catch (error) {
      logger.error(`Erreur lors de la recherche des meilleurs candidats: ${error.message}`);
      throw error;
    }
  },

  /**
   * Recalcule les scores de matching suite à une modification d'une offre
   */
  async recalculateScoresAfterJobUpdate(jobId) {
    try {
      // Mettre à jour tous les candidats de cette offre
      await this.updateAllCandidatesForJob(jobId);
      return true;
    } catch (error) {
      logger.error(`Erreur lors du recalcul des scores après mise à jour de l'offre: ${error.message}`);
      throw new Error(`Erreur lors du recalcul des scores: ${error.message}`);
    }
  }
};

module.exports = matchingService;