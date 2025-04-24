const { respondWithSuccess, respondWithError, createPagination } = require('../../utils/apiResponse');

describe('API Response Utilities', () => {
  let mockResponse;
  let originalNodeEnv;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Sauvegarder l'environnement original
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restaurer l'environnement
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('respondWithSuccess', () => {
    it('should respond with success and data', () => {
      const statusCode = 200;
      const message = 'Success message';
      const data = { id: 1, name: 'Test' };
      
      respondWithSuccess(mockResponse, statusCode, message, data);
      
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message,
        data
      });
    });

    it('should include pagination information when provided', () => {
      const statusCode = 200;
      const message = 'Paginated data';
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, limit: 10, total: 20, totalPages: 2 };
      
      respondWithSuccess(mockResponse, statusCode, message, data, pagination);
      
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message,
        data,
        pagination
      });
    });
  });

  describe('respondWithError', () => {
    it('should respond with error message', () => {
      const statusCode = 400;
      const message = 'Validation error';
      
      respondWithError(mockResponse, statusCode, message);
      
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message
      });
    });

    it('should mask internal server errors in production', () => {
      process.env.NODE_ENV = 'production';
      const statusCode = 500;
      const message = 'Database connection failed';
      
      respondWithError(mockResponse, statusCode, message);
      
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Une erreur interne est survenue'
      });
    });

    it('should show original error message for non-500 errors in production', () => {
      process.env.NODE_ENV = 'production';
      const statusCode = 404;
      const message = 'Resource not found';
      
      respondWithError(mockResponse, statusCode, message);
      
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message
      });
    });

    it('should include error details in development', () => {
      process.env.NODE_ENV = 'development';
      const statusCode = 500;
      const message = 'Database error';
      const errors = { details: 'Connection timeout' };
      
      respondWithError(mockResponse, statusCode, message, errors);
      
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message,
        errors
      });
    });

    it('should not include error details in production', () => {
      process.env.NODE_ENV = 'production';
      const statusCode = 500;
      const message = 'Database error';
      const errors = { details: 'Connection timeout' };
      
      respondWithError(mockResponse, statusCode, message, errors);
      
      expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Une erreur interne est survenue'
      });
      expect(mockResponse.json.mock.calls[0][0].errors).toBeUndefined();
    });
  });

  describe('createPagination', () => {
    it('should create proper pagination object', () => {
      const page = 2;
      const limit = 10;
      const total = 25;
      
      const pagination = createPagination(page, limit, total);
      
      expect(pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3 // Math.ceil(25/10) = 3
      });
    });

    it('should convert string inputs to integers', () => {
      const page = '2';
      const limit = '10';
      const total = 25;
      
      const pagination = createPagination(page, limit, total);
      
      expect(pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3
      });
    });

    it('should calculate correct total pages', () => {
      const testCases = [
        { page: 1, limit: 10, total: 5, expected: 1 },   // Less than limit
        { page: 1, limit: 10, total: 10, expected: 1 },  // Equal to limit
        { page: 1, limit: 10, total: 11, expected: 2 },  // Just over limit
        { page: 3, limit: 5, total: 21, expected: 5 },   // Multiple pages
        { page: 1, limit: 100, total: 0, expected: 0 }   // No items
      ];
      
      testCases.forEach(test => {
        const pagination = createPagination(test.page, test.limit, test.total);
        expect(pagination.totalPages).toBe(test.expected);
      });
    });
  });
});