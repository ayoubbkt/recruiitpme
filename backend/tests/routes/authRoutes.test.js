const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../../routes/authRoutes');
const authController = require('../../controllers/authController');
const { authenticate } = require('../../middleware/auth');

// Mocks
jest.mock('../../controllers/authController', () => ({
  register: jest.fn((req, res) => res.json({ success: true, message: 'Register mock' })),
  login: jest.fn((req, res) => res.json({ success: true, message: 'Login mock' })),
  verifyEmail: jest.fn((req, res) => res.json({ success: true, message: 'Verify email mock' })),
  requestPasswordReset: jest.fn((req, res) => res.json({ success: true, message: 'Request password reset mock' })),
  resetPassword: jest.fn((req, res) => res.json({ success: true, message: 'Reset password mock' })),
  getProfile: jest.fn((req, res) => res.json({ success: true, message: 'Get profile mock' })),
  updateProfile: jest.fn((req, res) => res.json({ success: true, message: 'Update profile mock' })),
  changePassword: jest.fn((req, res) => res.json({ success: true, message: 'Change password mock' }))
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
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should call register controller', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(200);
      expect(authController.register).toHaveBeenCalledWith(
        expect.objectContaining({
          body: userData
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Register mock' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller', async () => {
      // Arrange
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalledWith(
        expect.objectContaining({
          body: loginData
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Login mock' });
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should call verifyEmail controller', async () => {
      // Arrange
      const verifyData = {
        token: 'verification-token'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verifyData);

      // Assert
      expect(response.status).toBe(200);
      expect(authController.verifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: verifyData
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Verify email mock' });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should call getProfile controller with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me');

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(authController.getProfile).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, message: 'Get profile mock' });
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should call updateProfile controller with authentication', async () => {
      // Arrange
      const profileData = {
        firstName: 'Updated',
        lastName: 'User'
      };

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .send(profileData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(authController.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          body: profileData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Update profile mock' });
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should call changePassword controller with authentication', async () => {
      // Arrange
      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/change-password')
        .send(passwordData);

      // Assert
      expect(response.status).toBe(200);
      expect(authenticate).toHaveBeenCalled();
      expect(authController.changePassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: passwordData,
          user: { id: '1', email: 'user@example.com' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.body).toEqual({ success: true, message: 'Change password mock' });
    });
  });
});