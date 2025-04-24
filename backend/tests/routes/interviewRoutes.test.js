const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const interviewRoutes = require('../../routes/interviewRoutes');
const interviewController = require('../../controllers/interviewController');
const { authenticate } = require('../../middleware/auth');

// Mocks
jest.mock('../../controllers/interviewController', () => ({
  getInterviews: jest.fn((req, res) => res.json({ success: true, message: 'Get interviews mock' })),
  getInterviewById: jest.fn((req, res) => res.json({ success: true, message: 'Get interview by id mock' })),
  createInterview: jest.fn((req, res) => res.json({ success: true, message: 'Create interview mock' })),
  updateInterview: jest.fn((req, res) => res.json({ success: true, message: 'Update interview mock' })),
  deleteInterview: jest.fn((req, res) => res.json({ success: true, message: 'Delete interview mock' })),
  addInterviewFeedback: jest.fn((req, res) => res.json({ success: true, message: 'Add interview feedback mock' }))
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
app.use('/api/interviews', interviewRoutes);

describe('Interview Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/interviews', () => {
    it('should call getInterviews controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/interviews')
        .query({ page: 1, limit: 10, upcoming: 'true' });

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(interviewController.getInterviews).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { page: '1', limit: '10', upcoming: 'true' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Get interviews mock' });
    });
  });

  describe('GET /api/interviews/:id', () => {
    it('should call getInterviewById controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/interviews/1');

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(interviewController.getInterviewById).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Get interview by id mock' });
    });
  });

  describe('POST /api/interviews', () => {
    it('should call createInterview controller with authentication', async () => {
      // Arrange
      const interviewData = {
        candidateId: '1',
        date: '2025-05-15',
        time: '10:00',
        interviewer: 'Jane Doe',
        videoLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Interview notes',
        sendEmail: true
      };

      // Act
      const response = await request(app)
        .post('/api/interviews')
        .send(interviewData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(interviewController.createInterview).toHaveBeenCalledWith(
        expect.objectContaining({
          body: interviewData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Create interview mock' });
    });
  });

  describe('PUT /api/interviews/:id', () => {
    it('should call updateInterview controller with authentication', async () => {
      // Arrange
      const interviewData = {
        date: '2025-05-20',
        time: '14:00',
        interviewer: 'Updated Interviewer',
        videoLink: 'https://zoom.us/j/123456',
        notes: 'Updated notes',
        status: 'completed'
      };

      // Act
      const response = await request(app)
        .put('/api/interviews/1')
        .send(interviewData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(interviewController.updateInterview).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: interviewData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Update interview mock' });
    });
  });

  describe('DELETE /api/interviews/:id', () => {
    it('should call deleteInterview controller with authentication', async () => {
      // Act
      const response = await request(app)
        .delete('/api/interviews/1');

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(interviewController.deleteInterview).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Delete interview mock' });
    });
  });

  describe('POST /api/interviews/:id/feedback', () => {
    it('should call addInterviewFeedback controller with authentication', async () => {
      // Arrange
      const feedbackData = {
        feedback: 'Excellent candidate, good technical knowledge'
      };

      // Act
      const response = await request(app)
        .post('/api/interviews/1/feedback')
        .send(feedbackData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(interviewController.addInterviewFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: feedbackData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Add interview feedback mock' });
    });
  });
});