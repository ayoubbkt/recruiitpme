const { PrismaClient } = require('@prisma/client');
const jobController = require('../../controllers/jobController');
const matchingService = require('../../services/matchingService');

// Mocks
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    job: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    candidate: {
      count: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

jest.mock('../../services/matchingService', () => ({
  recalculateScoresAfterJobUpdate: jest.fn(),
  findBestCandidatesForJob: jest.fn()
}));

const prisma = new PrismaClient();
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};

describe('Job Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getJobs', () => {
    it('should get jobs with pagination', async () => {
      // Arrange
      const req = {
        query: {
          page: '1',
          limit: '10',
          status: 'active'
        }
      };
      
      const mockJobs = [
        {
          id: '1',
          title: 'Developer',
          location: 'Paris',
          contractType: 'cdi',
          _count: {
            candidates: 5
          }
        },
        {
          id: '2',
          title: 'Designer',
          location: 'Lyon',
          contractType: 'cdi',
          _count: {
            candidates: 3
          }
        }
      ];
      
      prisma.job.count.mockResolvedValue(2);
      prisma.job.findMany.mockResolvedValue(mockJobs);

      // Act
      await jobController.getJobs(req, res);

      // Assert
      expect(prisma.job.count).toHaveBeenCalledWith({
        where: { status: 'active' }
      });
      expect(prisma.job.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            title: 'Developer',
            candidates: expect.objectContaining({
              total: 5
            })
          })
        ]),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        })
      }));
    });

    it('should filter jobs by search query', async () => {
      // Arrange
      const req = {
        query: {
          page: '1',
          limit: '10',
          search: 'developer'
        }
      };
      
      prisma.job.count.mockResolvedValue(1);
      prisma.job.findMany.mockResolvedValue([
        {
          id: '1',
          title: 'Developer',
          location: 'Paris',
          _count: {
            candidates: 5
          }
        }
      ]);

      // Act
      await jobController.getJobs(req, res);

      // Assert
      expect(prisma.job.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'developer', mode: 'insensitive' } },
            { location: { contains: 'developer', mode: 'insensitive' } },
            { description: { contains: 'developer', mode: 'insensitive' } }
          ]
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getJobById', () => {
    it('should get job by id with candidates count', async () => {
      // Arrange
      const req = {
        params: {
          id: '1'
        }
      };
      
      const mockJob = {
        id: '1',
        title: 'Developer',
        location: 'Paris',
        contractType: 'cdi',
        _count: {
          candidates: 5
        },
        candidates: [
          { status: 'new' },
          { status: 'toContact' },
          { status: 'interview' },
          { status: 'hired' },
          { status: 'rejected' }
        ]
      };
      
      prisma.job.findUnique.mockResolvedValue(mockJob);

      // Act
      await jobController.getJobById(req, res);

      // Assert
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id },
        include: expect.objectContaining({
          _count: {
            select: { candidates: true }
          },
          candidates: {
            select: { status: true }
          }
        })
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: 'Developer',
          candidates: expect.objectContaining({
            total: 5,
            byStatus: expect.objectContaining({
              new: 1,
              toContact: 1,
              interview: 1,
              hired: 1,
              rejected: 1
            })
          })
        })
      }));
    });

    it('should return 404 if job not found', async () => {
      // Arrange
      const req = {
        params: {
          id: 'nonexistent'
        }
      };
      
      prisma.job.findUnique.mockResolvedValue(null);

      // Act
      await jobController.getJobById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Offre non trouvée'
      }));
    });
  });

  describe('createJob', () => {
    it('should create a job successfully', async () => {
      // Arrange
      const req = {
        body: {
          title: 'Full Stack Developer',
          location: 'Paris',
          contractType: 'cdi',
          experienceLevel: 'intermediate',
          description: 'Job description',
          skills: ['JavaScript', 'React', 'Node.js'],
          pipelineStages: ['À contacter', 'Entretien', 'Embauché']
        },
        user: {
          id: '1'
        }
      };
      
      const mockJob = {
        id: '1',
        ...req.body,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      prisma.job.create.mockResolvedValue(mockJob);

      // Act
      await jobController.createJob(req, res);

      // Assert
      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: req.body.title,
          location: req.body.location,
          contractType: req.body.contractType,
          experienceLevel: req.body.experienceLevel,
          description: req.body.description,
          skills: req.body.skills,
          pipelineStages: req.body.pipelineStages,
          userId: req.user.id
        })
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: req.body.title
        })
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const req = {
        body: {
          title: 'Full Stack Developer',
          // Missing required fields
        },
        user: {
          id: '1'
        }
      };

      // Act
      await jobController.createJob(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      }));
    });
  });

  describe('updateJob', () => {
    beforeEach(() => {
        // Configuration des mocks
        jest.clearAllMocks();
        matchingService.recalculateScoresAfterJobUpdate.mockResolvedValue(true);
      });
    it('should update a job successfully', async () => {
      // Arrange
      const req = {
        params: {
          id: '1'
        },
        body: {
          title: 'Updated Developer',
          location: 'Lyon',
          contractType: 'cdi',
          experienceLevel: 'senior',
          description: 'Updated description',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          pipelineStages: ['À contacter', 'Entretien', 'Test', 'Embauché']
        }
      };
      
      const existingJob = {
        id: '1',
        title: 'Developer',
        location: 'Paris',
        contractType: 'cdi',
        experienceLevel: 'intermediate',
        description: 'Job description',
        skills: ['JavaScript', 'React', 'Node.js'],
        pipelineStages: ['À contacter', 'Entretien', 'Embauché'],
        languages: null
      };
      
      const updatedJob = {
        id: '1',
        ...req.body,
        updatedAt: new Date()
      };
      
      prisma.job.findUnique.mockResolvedValue(existingJob);
      prisma.job.update.mockResolvedValue(updatedJob);

      // Act
      await jobController.updateJob(req, res);

      // Assert
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: req.params.id },
        data: expect.objectContaining(req.body)
      });
      expect(matchingService.recalculateScoresAfterJobUpdate).toHaveBeenCalledWith(req.params.id);
      matchingService.recalculateScoresAfterJobUpdate.mockResolvedValue(true);
        prisma.job.update.mockResolvedValue(updatedJob);


        // puis modifier l'attente:
        expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: req.body.title
        })
      }));
    });

    it('should return 404 if job not found', async () => {
      // Arrange
      const req = {
        params: {
          id: 'nonexistent'
        },
        body: {
          title: 'Updated Developer'
        }
      };
      
      prisma.job.findUnique.mockResolvedValue(null);

      // Act
      await jobController.updateJob(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Offre non trouvée'
      }));
    });
  });

  describe('deleteJob', () => {
    it('should delete a job successfully', async () => {
      // Arrange
      const req = {
        params: {
          id: '1'
        }
      };
      
      const mockJob = {
        id: '1',
        title: 'Developer'
      };
      
      prisma.job.findUnique.mockResolvedValue(mockJob);
      prisma.candidate.count.mockResolvedValue(2);
      prisma.job.delete.mockResolvedValue(mockJob);

      // Act
      await jobController.deleteJob(req, res);

      // Assert
      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(prisma.candidate.count).toHaveBeenCalledWith({
        where: { jobId: req.params.id }
      });
      expect(prisma.job.delete).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Offre supprimée avec succès')
      }));
    });

    it('should return 404 if job not found', async () => {
      // Arrange
      const req = {
        params: {
          id: 'nonexistent'
        }
      };
      
      prisma.job.findUnique.mockResolvedValue(null);

      // Act
      await jobController.deleteJob(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Offre non trouvée'
      }));
    });
  });
});