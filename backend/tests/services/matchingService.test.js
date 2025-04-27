// tests/services/matchingService.test.js
// Ne pas importer le service avant la configuration des mocks
const { PrismaClient } = require('@prisma/client');
const helpers = require('../../utils/helpers');
const logger = require('../../utils/logger');

// Configurer les mocks
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    candidate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    job: {
      findUnique: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

jest.mock('../../utils/helpers', () => ({
  calculateMatchingScore: jest.fn().mockReturnValue(90)
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Maintenant importer le service
const matchingService = require('../../services/matchingService');

// Mock complet du service pour pouvoir le restaurer
const originalService = { ...matchingService };
const prisma = new PrismaClient();

describe('Matching Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restaurer les fonctions originales du service
    Object.keys(originalService).forEach(key => {
      matchingService[key] = originalService[key];
    });
  });

  describe('matchCandidateWithJob', () => {
    it('should call calculateMatchingScore', () => {
      // Arrange
      const candidate = {
        id: '1',
        name: 'John Doe',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 3
      };
      
      const job = {
        id: '1',
        title: 'Full Stack Developer',
        skills: ['JavaScript', 'React', 'Node.js'],
        experienceLevel: 'intermediate'
      };
      
      // Act
      const result = matchingService.matchCandidateWithJob(candidate, job);

      // Assert
      expect(helpers.calculateMatchingScore).toHaveBeenCalledWith(candidate, job);
      expect(result).toBe(90);
    });
  });

  describe('updateCandidateMatchingScore', () => {
    it('should update candidate matching score', async () => {
      // Arrange
      const candidateId = '1';
      const jobId = '1';
      
      const candidate = {
        id: '1',
        name: 'John Doe',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 3
      };
      
      const job = {
        id: '1',
        title: 'Full Stack Developer',
        skills: ['JavaScript', 'React', 'Node.js'],
        experienceLevel: 'intermediate'
      };
      
      const updatedCandidate = {
        ...candidate,
        matchingScore: 90
      };
      
      // Mock la méthode interne du service
      matchingService.matchCandidateWithJob = jest.fn().mockReturnValue(90);
      
      prisma.candidate.findUnique.mockResolvedValue(candidate);
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.candidate.update.mockResolvedValue(updatedCandidate);

      // Act
      const result = await matchingService.updateCandidateMatchingScore(candidateId, jobId);

      // Assert
      expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
        where: { id: candidateId }
      });
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: jobId }
      });
      expect(matchingService.matchCandidateWithJob).toHaveBeenCalledWith(candidate, job);
      expect(prisma.candidate.update).toHaveBeenCalledWith({
        where: { id: candidateId },
        data: { matchingScore: 90 }
      });
      expect(result).toEqual(updatedCandidate);
    });

    it('should throw error if candidate not found', async () => {
      const candidateId = 'nonexistent';
      const jobId = '1';
      
      prisma.candidate.findUnique.mockResolvedValue(null);

      await expect(matchingService.updateCandidateMatchingScore(candidateId, jobId))
        .rejects.toThrow('Candidat ou offre non trouvé');
    });

    it('should throw error if job not found', async () => {
      const candidateId = '1';
      const jobId = 'nonexistent';
      
      const candidate = {
        id: '1',
        name: 'John Doe'
      };
      
      prisma.candidate.findUnique.mockResolvedValue(candidate);
      prisma.job.findUnique.mockResolvedValue(null);

      await expect(matchingService.updateCandidateMatchingScore(candidateId, jobId))
        .rejects.toThrow('Candidat ou offre non trouvé');
    });
  });

  describe('updateAllCandidatesForJob', () => {
    it('should update matching scores for all candidates of a job', async () => {
      // Arrange
      const jobId = '1';
      
      const job = {
        id: '1',
        title: 'Full Stack Developer',
        skills: ['JavaScript', 'React', 'Node.js'],
        experienceLevel: 'intermediate'
      };
      
      const candidates = [
        {
          id: '1',
          name: 'John Doe',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 3
        },
        {
          id: '2',
          name: 'Jane Smith',
          skills: ['JavaScript', 'Angular'],
          experience: 5
        }
      ];
      
      // Mock la méthode interne
      matchingService.matchCandidateWithJob = jest.fn()
        .mockReturnValueOnce(90)
        .mockReturnValueOnce(75);
      
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.candidate.findMany.mockResolvedValue(candidates);
      
      prisma.candidate.update
        .mockResolvedValueOnce({...candidates[0], matchingScore: 90})
        .mockResolvedValueOnce({...candidates[1], matchingScore: 75});

      // Act
      const result = await matchingService.updateAllCandidatesForJob(jobId);

      // Assert
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: jobId }
      });
      expect(prisma.candidate.findMany).toHaveBeenCalledWith({
        where: { jobId }
      });
      expect(matchingService.matchCandidateWithJob).toHaveBeenCalledTimes(2);
      expect(prisma.candidate.update).toHaveBeenCalledTimes(2);
      expect(prisma.candidate.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { matchingScore: 90 }
      });
      expect(prisma.candidate.update).toHaveBeenCalledWith({
        where: { id: '2' },
        data: { matchingScore: 75 }
      });
    });

    it('should throw error if job not found', async () => {
      const jobId = 'nonexistent';
      
      prisma.job.findUnique.mockResolvedValue(null);

      await expect(matchingService.updateAllCandidatesForJob(jobId))
        .rejects.toThrow('Offre non trouvée');
    });
  });

  describe('findBestCandidatesForJob', () => {
    it('should find and sort candidates by matching score', async () => {
      const jobId = '1';
      const limit = 2;
      
      const candidates = [
        {
          id: '1',
          name: 'John Doe',
          matchingScore: 90
        },
        {
          id: '2',
          name: 'Jane Smith',
          matchingScore: 85
        }
      ];
      
      prisma.candidate.findMany.mockResolvedValue(candidates);

      // Act
      const result = await matchingService.findBestCandidatesForJob(jobId, limit);

      // Assert
      expect(prisma.candidate.findMany).toHaveBeenCalledWith({
        where: { 
          jobId,
          status: { not: 'rejected' }
        },
        orderBy: { matchingScore: 'desc' },
        take: limit
      });
      expect(result.length).toBe(2);
      expect(result[0].matchingScore).toBe(90);
      expect(result[1].matchingScore).toBe(85);
    });
  });

  describe('recalculateScoresAfterJobUpdate', () => {
    it('should recalculate scores after job update', async () => {
      const jobId = '1';
      
      // Mock la méthode interne pour éviter l'erreur
      matchingService.updateAllCandidatesForJob = jest.fn().mockResolvedValue([]);
      
      // Act
      const result = await matchingService.recalculateScoresAfterJobUpdate(jobId);
      
      // Assert
      expect(matchingService.updateAllCandidatesForJob).toHaveBeenCalledWith(jobId);
      expect(result).toBe(true);
    });

    it('should throw error if update fails', async () => {
      const jobId = '1';
      const error = new Error('Update failed');
      
      // Mock la méthode interne pour qu'elle échoue
      matchingService.updateAllCandidatesForJob = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(matchingService.recalculateScoresAfterJobUpdate(jobId))
        .rejects.toThrow('Erreur lors du recalcul des scores');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});