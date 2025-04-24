const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jobRoutes = require('../../routes/jobRoutes');
const jobController = require('../../controllers/jobController');
const { authenticate } = require('../../middleware/auth');

// Mocks
jest.mock('../../controllers/jobController', () => ({
  getJobs: jest.fn((req, res) => res.json({ success: true, message: 'Get jobs mock' })),
  getJobById: jest.fn((req, res) => res.json({ success: true, message: 'Get job by id mock' })),
  createJob: jest.fn((req, res) => res.json({ success: true, message: 'Create job mock' })),
  updateJob: jest.fn((req, res) => res.json({ success: true, message: 'Update job mock' })),
  deleteJob: jest.fn((req, res) => res.json({ success: true, message: 'Delete job mock' })),
  getBestCandidatesForJob: jest.fn((req, res) => res.json({ success: true, message: 'Get best candidates mock' }))
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: '1', email: 'user@example.com' };
    next();
  })
}));

jest.mock('../../middleware/validation', () => ({
  validate: () => (req, res, next) => next()
}));

// Create Express app for testing
const app = express();
app.use(bodyParser.json());
app.use('/api/jobs', jobRoutes);

describe('Job Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/jobs', () => {
    it('should call getJobs controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/jobs')
        .query({ page: 1, limit: 10, status: 'active' });

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(jobController.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { page: '1', limit: '10', status: 'active' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Get jobs mock' });
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should call getJobById controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/jobs/1');

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(jobController.getJobById).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Get job by id mock' });
    });
  });

  describe('POST /api/jobs', () => {
    it('should call createJob controller with authentication', async () => {
      // Arrange
      const jobData = {
        title: 'Full Stack Developer',
        location: 'Paris',
        contractType: 'cdi',
        experienceLevel: 'intermediate',
        description: 'Job description',
        skills: ['JavaScript', 'React', 'Node.js'],
        pipelineStages: ['À contacter', 'Entretien', 'Embauché']
      };

      // Act
      const response = await request(app)
        .post('/api/jobs')
        .send(jobData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(jobController.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          body: jobData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Create job mock' });
    });
  });

  describe('PUT /api/jobs/:id', () => {
    it('should call updateJob controller with authentication', async () => {
      // Arrange
      const jobData = {
        title: 'Updated Developer',
        location: 'Lyon',
        contractType: 'cdi',
        experienceLevel: 'senior',
        description: 'Updated description',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        pipelineStages: ['À contacter', 'Entretien', 'Test', 'Embauché']
      };

      // Act
      const response = await request(app)
        .put('/api/jobs/1')
        .send(jobData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(jobController.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: jobData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Update job mock' });
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    it('should call deleteJob controller with authentication', async () => {
      // Act
      const response = await request(app)
        .delete('/api/jobs/1');

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(jobController.deleteJob).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Delete job mock' });
    });
  });

  describe('GET /api/jobs/:id/match', () => {
    it('should call getBestCandidatesForJob controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/jobs/1/match')
        .query({ limit: 5 });

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(jobController.getBestCandidatesForJob).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          query: { limit: '5' },
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );

      
      expect(response.body).toEqual({ success: true, message: 'Get best candidates mock' });
    });
  });
});