const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const candidateRoutes = require('../../routes/candidateRoutes');
const candidateController = require('../../controllers/candidateController');
const { authenticate } = require('../../middleware/auth');
const { uploadCV, handleUploadError } = require('../../middleware/upload');

// Mocks
jest.mock('../../controllers/candidateController', () => ({
  getCandidates: jest.fn((req, res) => res.json({ success: true, message: 'Get candidates mock' })),
  getCandidateById: jest.fn((req, res) => res.json({ success: true, message: 'Get candidate by id mock' })),
  uploadAndAnalyzeCV: jest.fn((req, res) => res.json({ success: true, message: 'Upload and analyze CV mock' })),
  updateCandidateStatus: jest.fn((req, res) => res.json({ success: true, message: 'Update candidate status mock' })),
  addCandidateNote: jest.fn((req, res) => res.json({ success: true, message: 'Add candidate note mock' })),
  deleteCandidate: jest.fn((req, res) => res.json({ success: true, message: 'Delete candidate mock' }))
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: '1', email: 'user@example.com' };
    next();
  })
}));
const mockArray = jest.fn().mockImplementation(() => (req, res, next) => next());

jest.mock('../../middleware/upload', () => ({
  uploadCV: {
    array: mockArray
  },
  handleUploadError: jest.fn((req, res, next) => next())
}));

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    // uploadCV.array.mockImplementation(() => (req, res, next) => next());
  });

jest.mock('../../middleware/validation', () => ({
  validate: () => (req, res, next) => next()
}));

// Create Express app for testing
const app = express();
app.use(bodyParser.json());
app.use('/api/candidates', candidateRoutes);

describe('Candidate Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/candidates', () => {
    it('should call getCandidates controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, limit: 20, jobId: '1', status: 'new' });

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(candidateController.getCandidates).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { page: '1', limit: '20', jobId: '1', status: 'new' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Get candidates mock' });
    });
  });

  describe('GET /api/candidates/:id', () => {
    it('should call getCandidateById controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/candidates/1');

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(candidateController.getCandidateById).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Get candidate by id mock' });
    });
  });

  describe('POST /api/candidates/upload', () => {
    it('should call uploadAndAnalyzeCV controller with authentication and file upload middleware', async () => {
      // Act
      const response = await request(app)
        .post('/api/candidates/upload')
        .field('jobId', '1');

      // Assert
      expect(response.status).toBe(200);
      expect(mockArray).toHaveBeenCalledWith('files', 10);
      expect(uploadCV.array).toHaveBeenCalledWith('files', 10);
      expect(candidateController.uploadAndAnalyzeCV).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, message: 'Upload and analyze CV mock' });
    });
  });

  describe('POST /api/candidates/:id/status', () => {
    it('should call updateCandidateStatus controller with authentication', async () => {
      // Arrange
      const statusData = {
        status: 'interview'
      };

      // Act
      const response = await request(app)
        .post('/api/candidates/1/status')
        .send(statusData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(candidateController.updateCandidateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: statusData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Update candidate status mock' });
    });
  });

  describe('POST /api/candidates/:id/notes', () => {
    it('should call addCandidateNote controller with authentication', async () => {
      // Arrange
      const noteData = {
        text: 'This is a note'
      };

      // Act
      const response = await request(app)
        .post('/api/candidates/1/notes')
        .send(noteData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(candidateController.addCandidateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: noteData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Add candidate note mock' });
    });
  });

  describe('DELETE /api/candidates/:id', () => {
    it('should call deleteCandidate controller with authentication', async () => {
      // Act
      const response = await request(app)
        .delete('/api/candidates/1');

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(candidateController.deleteCandidate).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Delete candidate mock' });
    });
  });
});