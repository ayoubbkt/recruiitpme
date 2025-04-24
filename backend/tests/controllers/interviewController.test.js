const { PrismaClient } = require('@prisma/client');
const interviewController = require('../../controllers/interviewController');
const emailService = require('../../services/emailService');

// Mocks
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    interview: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    candidate: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

jest.mock('../../services/emailService', () => ({
  sendInterviewInvitation: jest.fn()
}));

const prisma = new PrismaClient();
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};

describe('Interview Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInterviews', () => {
    it('should get interviews with pagination and filtering', async () => {
      // Arrange
      const req = {
        query: {
          page: '1',
          limit: '10',
          upcoming: 'true',
          candidateId: '1'
        }
      };
      
      const mockInterviews = [
        {
          id: '1',
          date: new Date('2025-05-15T10:00:00Z'),
          candidate: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          job: {
            title: 'Developer'
          }
        },
        {
          id: '2',
          date: new Date('2025-05-20T14:00:00Z'),
          candidate: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          job: {
            title: 'Developer'
          }
        }
      ];
      
      prisma.interview.count.mockResolvedValue(2);
      prisma.interview.findMany.mockResolvedValue(mockInterviews);

      // Act
      await interviewController.getInterviews(req, res);

      // Assert
      expect(prisma.interview.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          candidateId: req.query.candidateId,
          date: { gte: expect.any(Date) }
        })
      });
      expect(prisma.interview.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          candidateId: req.query.candidateId,
          date: { gte: expect.any(Date) }
        }),
        orderBy: { date: 'asc' },
        skip: 0,
        take: 10,
        include: expect.objectContaining({
          candidate: expect.any(Object),
          job: expect.any(Object)
        })
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            candidateName: 'John Doe',
            candidateEmail: 'john@example.com',
            jobTitle: 'Developer'
          })
        ])
      }));
    });
  });

  describe('getInterviewById', () => {
    it('should get interview by id with related data', async () => {
      // Arrange
      const req = {
        params: {
          id: '1'
        }
      };
      
      const mockInterview = {
        id: '1',
        date: new Date('2025-05-15T10:00:00Z'),
        candidate: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123456789'
        },
        job: {
          id: '1',
          title: 'Developer',
          location: 'Paris'
        }
      };
      
      prisma.interview.findUnique.mockResolvedValue(mockInterview);

      // Act
      await interviewController.getInterviewById(req, res);

      // Assert
      expect(prisma.interview.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id },
        include: expect.objectContaining({
          candidate: expect.any(Object),
          job: expect.any(Object)
        })
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: '1',
          candidate: expect.objectContaining({
            id: '1',
            name: 'John Doe'
          }),
          job: expect.objectContaining({
            id: '1',
            title: 'Developer'
          })
        })
      }));
    });

    it('should return 404 if interview not found', async () => {
      // Arrange
      const req = {
        params: {
          id: 'nonexistent'
        }
      };
      
      prisma.interview.findUnique.mockResolvedValue(null);

      // Act
      await interviewController.getInterviewById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Entretien non trouvé'
      }));
    });
  });

  describe('createInterview', () => {
    it('should create an interview successfully', async () => {
      // Arrange
      const req = {
        body: {
          candidateId: '1',
          date: '2025-05-15',
          time: '10:00',
          interviewer: 'Jane Doe',
          videoLink: 'https://meet.google.com/abc-defg-hij',
          notes: 'Interview notes',
          sendEmail: true
        },
        user: {
          id: '1'
        }
      };
      
      const mockCandidate = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'toContact',
        jobId: '1',
        job: {
          id: '1',
          title: 'Developer'
        }
      };
      
      const mockInterview = {
        id: '1',
        candidateId: '1',
        jobId: '1',
        date: new Date('2025-05-15T10:00:00Z'),
        time: '10:00',
        interviewer: 'Jane Doe',
        videoLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Interview notes',
        status: 'scheduled',
        interviewerId: '1'
      };
      
      prisma.candidate.findUnique.mockResolvedValue(mockCandidate);
      prisma.interview.create.mockResolvedValue(mockInterview);
      prisma.candidate.update.mockResolvedValue({
        ...mockCandidate,
        status: 'interview'
      });

      // Act
      await interviewController.createInterview(req, res);

      // Assert
      expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
        where: { id: req.body.candidateId },
        include: {
          job: true
        }
      });
      expect(prisma.interview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          candidateId: req.body.candidateId,
          jobId: mockCandidate.jobId,
          interviewer: req.body.interviewer,
          videoLink: req.body.videoLink,
          notes: req.body.notes,
          status: 'scheduled',
          interviewerId: req.user.id
        })
      });
      expect(prisma.candidate.update).toHaveBeenCalledWith({
        where: { id: req.body.candidateId },
        data: {
          status: 'interview',
          lastActivity: expect.any(Date)
        }
      });
      expect(emailService.sendInterviewInvitation).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: '1',
          candidateId: '1'
        })
      }));
    });

    it('should return 404 if candidate not found', async () => {
      // Arrange
      const req = {
        body: {
          candidateId: 'nonexistent',
          date: '2025-05-15',
          time: '10:00',
          interviewer: 'Jane Doe'
        }
      };
      
      prisma.candidate.findUnique.mockResolvedValue(null);

      // Act
      await interviewController.createInterview(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Candidat non trouvé'
      }));
    });

    it('should return 400 if date is in the past', async () => {
      // Arrange
      const req = {
        body: {
          candidateId: '1',
          date: '2020-01-01',
          time: '10:00',
          interviewer: 'Jane Doe'
        }
      };
      
      const mockCandidate = {
        id: '1',
        name: 'John Doe',
        jobId: '1',
        job: {
          id: '1',
          title: 'Developer'
        }
      };
      
      prisma.candidate.findUnique.mockResolvedValue(mockCandidate);

      // Act
      await interviewController.createInterview(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'La date et l\'heure de l\'entretien ne peuvent pas être dans le passé'
      }));
    });
  });

  describe('updateInterview', () => {
    it('should update an interview successfully', async () => {
      // Arrange
      const req = {
        params: {
          id: '1'
        },
        body: {
          date: '2025-05-20',
          time: '14:00',
          interviewer: 'Updated Interviewer',
          videoLink: 'https://zoom.us/j/123456',
          notes: 'Updated notes',
          status: 'completed',
          feedback: 'Good interview',
          sendEmail: true
        }
      };
      
      const existingInterview = {
        id: '1',
        date: new Date('2025-05-15T10:00:00Z'),
        time: '10:00',
        interviewer: 'Jane Doe',
        videoLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Interview notes',
        status: 'scheduled',
        candidate: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'interview'
        },
        job: {
          id: '1',
          title: 'Developer'
        }
      };
      
      const updatedInterview = {
        ...existingInterview,
        date: new Date('2025-05-20T14:00:00Z'),
        time: '14:00',
        interviewer: 'Updated Interviewer',
        videoLink: 'https://zoom.us/j/123456',
        notes: 'Updated notes',
        status: 'completed',
        feedback: 'Good interview'
      };
      
      prisma.interview.findUnique.mockResolvedValue(existingInterview);
      prisma.interview.update.mockResolvedValue(updatedInterview);
      prisma.candidate.update.mockResolvedValue(existingInterview.candidate);

      // Act
      await interviewController.updateInterview(req, res);

      // Assert
      expect(prisma.interview.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id },
        include: {
          candidate: true,
          job: true
        }
      });
      expect(prisma.interview.update).toHaveBeenCalledWith({
        where: { id: req.params.id },
        data: expect.objectContaining({
          date: expect.any(Date),
          time: req.body.time,
          interviewer: req.body.interviewer,
          videoLink: req.body.videoLink,
          notes: req.body.notes,
          status: req.body.status,
          feedback: req.body.feedback
        })
      });
      expect(emailService.sendInterviewInvitation).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: '1',
          status: 'completed'
        })
      }));
    });

    it('should return 404 if interview not found', async () => {
      // Arrange
      const req = {
        params: {
          id: 'nonexistent'
        },
        body: {
          date: '2025-05-20',
          time: '14:00'
        }
      };
      
      prisma.interview.findUnique.mockResolvedValue(null);

      // Act
      await interviewController.updateInterview(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Entretien non trouvé'
      }));
    });
  });

  describe('deleteInterview', () => {
    it('should delete an interview successfully', async () => {
      // Arrange
      const req = {
        params: {
          id: '1'
        }
      };
      
      const mockInterview = {
        id: '1',
        candidateId: '1',
        jobId: '1'
      };
      
      prisma.interview.findUnique.mockResolvedValue(mockInterview);
      prisma.interview.delete.mockResolvedValue(mockInterview);

      // Act
      await interviewController.deleteInterview(req, res);

      // Assert
      expect(prisma.interview.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(prisma.interview.delete).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Entretien supprimé avec succès'
      }));
    });

    it('should return 404 if interview not found', async () => {
      // Arrange
      const req = {
        params: {
          id: 'nonexistent'
        }
      };
      
      prisma.interview.findUnique.mockResolvedValue(null);

      // Act
      await interviewController.deleteInterview(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Entretien non trouvé'
      }));
    });
  });

  describe('addInterviewFeedback', () => {
    it('should add feedback to an interview', async () => {
      // Arrange
      const req = {
        params: {
          id: '1'
        },
        body: {
          feedback: 'Excellent candidate, good technical knowledge'
        }
      };
      
      const mockInterview = {
        id: '1',
        status: 'scheduled',
        candidate: {
          id: '1'
        }
      };
      
      const updatedInterview = {
        ...mockInterview,
        feedback: req.body.feedback,
        status: 'completed'
      };
      
      prisma.interview.findUnique.mockResolvedValue(mockInterview);
      prisma.interview.update.mockResolvedValue(updatedInterview);

      // Act
      await interviewController.addInterviewFeedback(req, res);

      // Assert
      expect(prisma.interview.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id },
        include: {
          candidate: true
        }
      });
      expect(prisma.interview.update).toHaveBeenCalledWith({
        where: { id: req.params.id },
        data: {
          feedback: req.body.feedback,
          status: 'completed'
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: '1',
          feedback: req.body.feedback,
          status: 'completed'
        })
      }));
    });

    it('should return 404 if interview not found', async () => {
      // Arrange
      const req = {
        params: {
          id: 'nonexistent'
        },
        body: {
          feedback: 'Good interview'
        }
      };
      
      prisma.interview.findUnique.mockResolvedValue(null);

      // Act
      await interviewController.addInterviewFeedback(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Entretien non trouvé'
      }));
    });
  });
});