const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../controllers/authController');
const emailService = require('../../services/emailService');
const { generateToken } = require('../../utils/helpers');

// Mocks
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => 'salt'),
  hash: jest.fn(() => 'hashedPassword'),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token')
}));

jest.mock('../../services/emailService', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

jest.mock('../../utils/helpers', () => ({
  generateToken: jest.fn(() => 'random-token')
}));

const prisma = new PrismaClient();
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          companyName: 'Test Company'
        }
      };
      
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: '1',
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        companyName: req.body.companyName,
        emailVerified: false
      });

      // Act
      await authController.register(req, res);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: req.body.email }
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 'salt');
      expect(generateToken).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: req.body.email,
          passwordHash: 'hashedPassword',
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          companyName: req.body.companyName,
          verificationToken: 'random-token',
          emailVerified: false
        }
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          email: req.body.email
        })
      }));
    });

    it('should return 400 if user already exists', async () => {
      // Arrange
      const req = {
        body: {
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Existing',
          lastName: 'User',
          companyName: 'Existing Company'
        }
      };
      
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: req.body.email
      });

      // Act
      await authController.register(req, res);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: req.body.email }
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      }));
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const req = {
        body: {
          email: 'user@example.com',
          password: 'password123'
        }
      };
      
      const mockUser = {
        id: '1',
        email: req.body.email,
        passwordHash: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        emailVerified: true
      };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser);

      // Act
      await authController.login(req, res);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: req.body.email }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(req.body.password, mockUser.passwordHash);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email
        }),
        process.env.JWT_SECRET,
        expect.any(Object)
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLogin: expect.any(Date) }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: 'jwt-token',
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email
          })
        })
      }));
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const req = {
        body: {
          email: 'user@example.com',
          password: 'wrongpassword'
        }
      };
      
      const mockUser = {
        id: '1',
        email: req.body.email,
        passwordHash: 'hashedPassword',
        emailVerified: true
      };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await authController.login(req, res);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(req.body.password, mockUser.passwordHash);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Email ou mot de passe incorrect'
      }));
    });

    it('should return 401 if email not verified', async () => {
      // Arrange
      const req = {
        body: {
          email: 'unverified@example.com',
          password: 'password123'
        }
      };
      
      const mockUser = {
        id: '1',
        email: req.body.email,
        passwordHash: 'hashedPassword',
        emailVerified: false
      };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Veuillez vérifier votre email avant de vous connecter'
      }));
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully with valid token', async () => {
      // Arrange
      const req = {
        body: {
          token: 'valid-token'
        }
      };
      
      const mockUser = {
        id: '1',
        email: 'user@example.com'
      };
      
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        verificationToken: null
      });

      // Act
      await authController.verifyEmail(req, res);

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { verificationToken: req.body.token }
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          emailVerified: true,
          verificationToken: null
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.'
      }));
    });

    it('should return 400 for invalid token', async () => {
      // Arrange
      const req = {
        body: {
          token: 'invalid-token'
        }
      };
      
      prisma.user.findFirst.mockResolvedValue(null);

      // Act
      await authController.verifyEmail(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Token de vérification invalide'
      }));
    });
  });
});