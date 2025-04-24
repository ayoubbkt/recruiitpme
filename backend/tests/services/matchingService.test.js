const { PrismaClient } = require('@prisma/client');
const matchingService = require('../../services/matchingService');
const { calculateMatchingScore } = require('../../utils/helpers');
const logger = require('../../utils/logger');

// Mocks
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
  calculateMatchingScore: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const prisma = new PrismaClient();

describe('Matching Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
      
      calculateMatchingScore.mockReturnValue(90);

      // Act
      const result = matchingService.matchCandidateWithJob(candidate, job);

      // Assert
      expect(calculateMatchingScore).toHaveBeenCalledWith(candidate, job);
      expect(result).toBe(90);
    });
  });

  describe('updateCandidateMatchingScore', () => {
    matchingService.matchCandidateWithJob = jest.fn().mockReturnValue(90);
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
      
      prisma.candidate.findUnique.mockResolvedValue(candidate);
      prisma.job.findUnique.mockResolvedValue(job);
      matchingService.matchCandidateWithJob = jest.fn().mockReturnValue(90);
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
      // Arrange
      const candidateId = 'nonexistent';
      const jobId = '1';
      
      prisma.candidate.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(matchingService.updateCandidateMatchingScore(candidateId, jobId))
        .rejects.toThrow('Candidat ou offre non trouvé');
    });

    it('should throw error if job not found', async () => {
      // Arrange
      const candidateId = '1';
      const jobId = 'nonexistent';
      
      const candidate = {
        id: '1',
        name: 'John Doe'
      };
      
      prisma.candidate.findUnique.mockResolvedValue(candidate);
      prisma.job.findUnique.mockResolvedValue(null);

      // Act & Assert
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
      
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.candidate.findMany.mockResolvedValue(candidates);
      matchingService.matchCandidateWithJob = jest.fn()
        .mockReturnValueOnce(90) // First candidate
        .mockReturnValueOnce(75); // Second candidate
      prisma.candidate.update.mockImplementation((params) => {
        const candidate = candidates.find(c => c.id === params.where.id);
        return Promise.resolve({
          ...candidate,
          matchingScore: params.data.matchingScore
        });
      });

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
      expect(result).toHaveLength(2);
      expect(result[0].matchingScore).toBe(90);
      expect(result[1].matchingScore).toBe(75);
    });

    it('should throw error if job not found', async () => {
      // Arrange
      const jobId = 'nonexistent';
      
      prisma.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(matchingService.updateAllCandidatesForJob(jobId))
        .rejects.toThrow('Offre non trouvée');
    });
  });

  describe('findBestCandidatesForJob', () => {
    it('should find and sort candidates by matching score', async () => {
      // Arrange
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
        },
        {
          id: '3',
          name: 'Bob Johnson',
          matchingScore: 70
        }
      ];
      
      prisma.candidate.findMany.mockResolvedValue(candidates.slice(0, limit));

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
      expect(result).toHaveLength(2);
      expect(result[0].matchingScore).toBe(90);
      expect(result[1].matchingScore).toBe(85);
    });
  });

  describe('recalculateScoresAfterJobUpdate', () => {
    it('should recalculate scores after job update', async () => {
      // Arrange
      const jobId = '1';
      
      // Mock updateAllCandidatesForJob
      const mockUpdatedCandidates = [
        { id: '1', name: 'John Doe', matchingScore: 90 },
        { id: '2', name: 'Jane Smith', matchingScore: 85 }
      ];
      
      matchingService.updateAllCandidatesForJob = jest.fn().mockResolvedValue(mockUpdatedCandidates);

      // Act
      const result = await matchingService.recalculateScoresAfterJobUpdate(jobId);

      // Assert
      expect(matchingService.updateAllCandidatesForJob).toHaveBeenCalledWith(jobId);
      expect(result).toBe(true);
    });

    it('should throw error if update fails', async () => {
      // Arrange
      const jobId = '1';
      const error = new Error('Update failed');
      
      matchingService.updateAllCandidatesForJob = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(matchingService.recalculateScoresAfterJobUpdate(jobId))
        .rejects.toThrow('Erreur lors du recalcul des scores');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});