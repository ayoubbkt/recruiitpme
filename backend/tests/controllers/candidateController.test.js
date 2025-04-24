const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const candidateController = require('../../controllers/candidateController');
const cvParserService = require('../../services/cvParserService');
const storageService = require('../../services/storageService');
const matchingService = require('../../services/matchingService');

// Mocks
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    candidate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    job: {
      findUnique: jest.fn()
    },
    note: {
      create: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  unlink: jest.fn(),
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../../services/cvParserService', () => ({
  parseCV: jest.fn()
}));

jest.mock('../../services/storageService', () => ({
  getFileUrl: jest.fn(),
  deleteFile: jest.fn()
}));

jest.mock('../../services/matchingService', () => ({
  matchCandidateWithJob: jest.fn()
}));

const prisma = new PrismaClient();
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};

describe('Candidate Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCandidates', () => {
    it('should get candidates with pagination and filtering', async () => {
      // Arrange
      const req = {
        query: {
          page: '1',
          limit: '20',
          jobId: '1',
          status: 'new',
          sortBy: 'matchingScore',
          sortDirection: 'desc'
        }
      };
      
      const mockCandidates = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          job: { title: 'Developer' },
          matchingScore: 90,
          status: 'new'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          job: { title: 'Developer' },
          matchingScore: 85,
          status: 'new'
        }
      ];
      
      prisma.candidate.count.mockResolvedValue(2);
      prisma.candidate.findMany.mockResolvedValue(mockCandidates);

      // Act
      await candidateController.getCandidates(req, res);

      // Assert
      expect(prisma.candidate.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          jobId: req.query.jobId,
          status: req.query.status
        })
      });
      expect(prisma.candidate.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          jobId: req.query.jobId,
          status: req.query.status
        }),
        orderBy: { matchingScore: 'desc' },
        skip: 0,
        take: 20,
        include: expect.objectContaining({
          job: expect.any(Object)
        })
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: 'John Doe',
            jobTitle: 'Developer'
          })
        ])
    }));
  });

  it('should filter candidates by search query', async () => {
    // Arrange
    const req = {
      query: {
        page: '1',
        limit: '20',
        search: 'john'
      }
    };
    
    prisma.candidate.count.mockResolvedValue(1);
    prisma.candidate.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'John Doe',
        job: { title: 'Developer' }
      }
    ]);

    // Act
    await candidateController.getCandidates(req, res);

    // Assert
    expect(prisma.candidate.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'john', mode: 'insensitive' } },
          { email: { contains: 'john', mode: 'insensitive' } },
          { skills: { has: 'john' } }
        ]
      }
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('getCandidateById', () => {
  it('should get candidate by id with related data', async () => {
    // Arrange
    const req = {
      params: {
        id: '1'
      }
    };
    
    const mockCandidate = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      cvFile: 'john_cv.pdf',
      job: {
        id: '1',
        title: 'Developer'
      },
      notes: [
        {
          id: '1',
          text: 'Good candidate',
          createdAt: new Date()
        }
      ]
    };
    
    prisma.candidate.findUnique.mockResolvedValue(mockCandidate);
    storageService.getFileUrl.mockResolvedValue('https://example.com/cv.pdf');

    // Act
    await candidateController.getCandidateById(req, res);

    // Assert
    expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
      where: { id: req.params.id },
      include: expect.objectContaining({
        job: expect.any(Object),
        notes: expect.any(Object)
      })
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        id: '1',
        name: 'John Doe',
        jobId: '1',
        jobTitle: 'Developer'
      })
    }));
  });

  it('should return 404 if candidate not found', async () => {
    // Arrange
    const req = {
      params: {
        id: 'nonexistent'
      }
    };
    
    prisma.candidate.findUnique.mockResolvedValue(null);

    // Act
    await candidateController.getCandidateById(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Candidat non trouvé'
    }));
  });
});

describe('uploadAndAnalyzeCV', () => {
  it('should upload and analyze CVs successfully', async () => {
    // Arrange
    const req = {
      body: {
        jobId: '1'
      },
      files: [
        {
          filename: 'cv1.pdf',
          path: '/tmp/uploads/cv1.pdf'
        },
        {
          filename: 'cv2.pdf',
          path: '/tmp/uploads/cv2.pdf'
        }
      ]
    };
    
    const mockJob = {
      id: '1',
      title: 'Developer',
      skills: ['JavaScript', 'React']
    };
    
    const mockCvData1 = {
      name: 'John Doe',
      email: 'john@example.com',
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: 3
    };
    
    const mockCvData2 = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      skills: ['JavaScript', 'Angular'],
      experience: 2
    };
    
    const mockCandidate1 = {
      id: '1',
      name: 'John Doe',
      matchingScore: 90
    };
    
    const mockCandidate2 = {
      id: '2',
      name: 'Jane Smith',
      matchingScore: 75
    };
    
    prisma.job.findUnique.mockResolvedValue(mockJob);
    cvParserService.parseCV.mockImplementation((filename) => {
      if (filename === 'cv1.pdf') return Promise.resolve(mockCvData1);
      if (filename === 'cv2.pdf') return Promise.resolve(mockCvData2);
      return Promise.reject(new Error('Unknown file'));
    });
    matchingService.matchCandidateWithJob.mockImplementation((candidate, job) => {
      if (candidate.name === 'John Doe') return 90;
      if (candidate.name === 'Jane Smith') return 75;
      return 0;
    });
    prisma.candidate.create.mockImplementation((data) => {
      if (data.data.name === 'John Doe') return Promise.resolve(mockCandidate1);
      if (data.data.name === 'Jane Smith') return Promise.resolve(mockCandidate2);
      return Promise.reject(new Error('Unknown candidate'));
    });

    // Act
    await candidateController.uploadAndAnalyzeCV(req, res);

    // Assert
    expect(prisma.job.findUnique).toHaveBeenCalledWith({
      where: { id: req.body.jobId }
    });
    expect(cvParserService.parseCV).toHaveBeenCalledTimes(2);
    expect(matchingService.matchCandidateWithJob).toHaveBeenCalledTimes(2);
    expect(prisma.candidate.create).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        totalProcessed: 2,
        successCount: 2,
        results: expect.arrayContaining([
          expect.objectContaining({
            success: true,
            candidateId: '1',
            name: 'John Doe',
            matchingScore: 90
          })
        ])
      })
    }));
  });

  it('should return 404 if job not found', async () => {
    // Arrange
    const req = {
      body: {
        jobId: 'nonexistent'
      },
      files: [
        {
          filename: 'cv1.pdf',
          path: '/tmp/uploads/cv1.pdf'
        }
      ]
    };
    
    prisma.job.findUnique.mockResolvedValue(null);

    // Act
    await candidateController.uploadAndAnalyzeCV(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Offre d\'emploi non trouvée'
    }));
  });
}, 60000);

describe('updateCandidateStatus', () => {
  it('should update candidate status', async () => {
    // Arrange
    const req = {
      params: {
        id: '1'
      },
      body: {
        status: 'interview'
      }
    };
    
    const mockCandidate = {
      id: '1',
      name: 'John Doe',
      status: 'new'
    };
    
    const updatedCandidate = {
      ...mockCandidate,
      status: 'interview',
      lastActivity: new Date()
    };
    
    prisma.candidate.findUnique.mockResolvedValue(mockCandidate);
    prisma.candidate.update.mockResolvedValue(updatedCandidate);

    // Act
    await candidateController.updateCandidateStatus(req, res);

    // Assert
    expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
      where: { id: req.params.id }
    });
    expect(prisma.candidate.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        lastActivity: expect.any(Date)
      }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        id: '1',
        status: 'interview'
      })
    }));
  });

  it('should return 404 if candidate not found', async () => {
    // Arrange
    const req = {
      params: {
        id: 'nonexistent'
      },
      body: {
        status: 'interview'
      }
    };
    
    prisma.candidate.findUnique.mockResolvedValue(null);

    // Act
    await candidateController.updateCandidateStatus(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Candidat non trouvé'
    }));
  });

  it('should return 400 if status is invalid', async () => {
    // Arrange
    const req = {
      params: {
        id: '1'
      },
      body: {
        status: 'invalid-status'
      }
    };

    // Act
    await candidateController.updateCandidateStatus(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Statut invalide'
    }));
  });
});

describe('addCandidateNote', () => {
  it('should add a note to a candidate', async () => {
    // Arrange
    const req = {
      params: {
        id: '1'
      },
      body: {
        text: 'This is a note'
      },
      user: {
        firstName: 'Admin',
        lastName: 'User'
      }
    };
    
    const mockCandidate = {
      id: '1',
      name: 'John Doe'
    };
    
    const mockNote = {
      id: '1',
      text: 'This is a note',
      author: 'Admin User',
      candidateId: '1',
      createdAt: new Date()
    };
    
    prisma.candidate.findUnique.mockResolvedValue(mockCandidate);
    prisma.note.create.mockResolvedValue(mockNote);
    prisma.candidate.update.mockResolvedValue(mockCandidate);

    // Act
    await candidateController.addCandidateNote(req, res);

    // Assert
    expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
      where: { id: req.params.id }
    });
    expect(prisma.note.create).toHaveBeenCalledWith({
      data: {
        text: req.body.text,
        author: 'Admin User',
        candidateId: req.params.id
      }
    });
    expect(prisma.candidate.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: {
        lastActivity: expect.any(Date)
      }
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        id: '1',
        text: 'This is a note'
      })
    }));
  });

  it('should return 404 if candidate not found', async () => {
    // Arrange
    const req = {
      params: {
        id: 'nonexistent'
      },
      body: {
        text: 'This is a note'
      },
      user: {
        firstName: 'Admin',
        lastName: 'User'
      }
    };
    
    prisma.candidate.findUnique.mockResolvedValue(null);

    // Act
    await candidateController.addCandidateNote(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Candidat non trouvé'
    }));
  });
});
});