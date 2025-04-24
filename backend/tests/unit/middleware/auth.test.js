const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../../../middleware/auth');

// Mock pour respondWithError
jest.mock('../../../utils/apiResponse', () => ({
    respondWithError: jest.fn((res, code, message) => {
      res.status(code).json({ success: false, message });
      return res;
    })
  }));

describe('Authentication Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  let testUser;

  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = await prisma.user.create({
      data: {
        email: 'test-auth@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        emailVerified: true
      }
    });
  });

  afterAll(async () => {
    // Supprimer l'utilisateur de test
    await prisma.user.delete({ where: { id: testUser.id } });
    
    // Fermer la connexion Prisma
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Reset des mocks
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  it('should reject request without Authorization header', async () => {
    await authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token manquant'
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request with invalid Authorization format', async () => {
    mockRequest.headers.authorization = 'InvalidFormat';
    
    await authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', async () => {
    mockRequest.headers.authorization = 'Bearer invalid-token';
    
    await authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request with expired token', async () => {
    // Créer un token expiré
    const expiredToken = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '0s' } // Expiré immédiatement
    );
    
    mockRequest.headers.authorization = `Bearer ${expiredToken}`;
    
    // Attendre un moment pour s'assurer que le token est expiré
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json.mock.calls[0][0].message).toMatch(/expiré/i);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request for non-existent user', async () => {
    // Créer un token avec un utilisateur qui n'existe pas
    const token = jwt.sign(
      { sub: 'non-existent-id', email: 'non-existent@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    mockRequest.headers.authorization = `Bearer ${token}`;
    
    await authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json.mock.calls[0][0].message).toBe('Utilisateur non trouvé');
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should pass request with valid token and existing user', async () => {
    // Créer un token valide
    const token = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    mockRequest.headers.authorization = `Bearer ${token}`;
    
    await authenticate(mockRequest, mockResponse, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user.id).toBe(testUser.id);
    expect(mockRequest.user.email).toBe(testUser.email);
  });
});