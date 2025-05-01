// services/matchingService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { calculateMatchingScore } = require('../utils/helpers');
const axios = require('axios');

// Configuration du service AI
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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
      // Récupérer l'offre depuis la base de données
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
      
      if (candidates.length === 0) {
        logger.info(`Aucun candidat trouvé pour l'offre ${jobId}, pas de recalcul nécessaire`);
        return;
      }
      
      logger.info(`Recalcul des scores pour ${candidates.length} candidats de l'offre ${jobId}`);
      
      // Préparer les données de l'offre pour l'API
      const jobOffer = {
        title: job.title,
        description: job.description,
        skills: job.skills || [],
        experience_level: job.experienceLevel
      };
      
      // Pour chaque candidat, effectuer un nouvel appel API pour recalculer le score
      // Vous pourriez optimiser cela en faisant un appel par lot
      for (const candidate of candidates) {
        try {
          // Appel à l'API Python pour calculer le nouveau score
          const response = await axios.post(
            `${AI_SERVICE_URL}/api/match/single/`,
            {
              job_offer: jobOffer,
              cv_file_key: candidate.cvFile
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 15000
            }
          );
          
          // Mettre à jour le score dans la base de données
          if (response.data && response.data.score) {
            await prisma.candidate.update({
              where: { id: candidate.id },
              data: { matchingScore: response.data.score }
            });
            
            logger.info(`Score mis à jour pour le candidat ${candidate.id}: ${response.data.score}`);
          }
        } catch (error) {
          logger.error(`Erreur lors du recalcul du score pour le candidat ${candidate.id}: ${error.message}`);
          // Continuer avec le candidat suivant
        }
      }
      
      logger.info(`Recalcul des scores terminé pour l'offre ${jobId}`);
    } catch (error) {
      logger.error(`Erreur lors du recalcul des scores de matching: ${error.message}`);
      throw error;
    }
  }
};

module.exports = matchingService;