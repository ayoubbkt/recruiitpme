const errorHandler = require('../../middleware/errorHandler');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

// Mocks
jest.mock('../../utils/logger', () => ({
  error: jest.fn()
}));

describe('Error Handler Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  let originalNodeEnv;

  beforeEach(() => {
    // Setup
    mockRequest = {
      path: '/api/test',
      method: 'GET'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    nextFunction = jest.fn();

    // Sauvegarder l'environnement original
    originalNodeEnv = process.env.NODE_ENV;

    // Reset des mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restaurer l'environnement
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should handle operational errors with correct status code', () => {
    const error = new ApiError(400, 'Bad Request');
    
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    
    expect(logger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad Request'
    });
  });

  it('should handle server errors in production without exposing details', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Database connection failed');
    error.statusCode = 500;
    
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    
    expect(logger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Erreur serveur interne'
    });
    // Vérifier que la stack trace n'est pas incluse
    expect(mockResponse.json.mock.calls[0][0].stack).toBeUndefined();
  });

  it('should include error message for server errors in development', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Database connection failed');
    error.statusCode = 500;
    error.stack = 'Error: Database connection failed\n    at Test.fn';
    
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    
    expect(logger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database connection failed',
      stack: 'Error: Database connection failed\n    at Test.fn'
    });
  });

  it('should use 500 as default status code if not provided', () => {
    const error = new Error('Unknown error without status code');
    
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    
    expect(logger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('should log detailed error information', () => {
    const error = new ApiError(404, 'Resource not found');
    
    errorHandler(error, mockRequest, mockResponse, nextFunction);
    
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Resource not found',
      stack: expect.any(String),
      path: '/api/test',
      method: 'GET',
      statusCode: 404
    }));
  });
});