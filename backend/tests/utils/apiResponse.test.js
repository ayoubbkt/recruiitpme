const { respondWithSuccess, respondWithError, createPagination } = require('../../../utils/apiResponse');

describe('API Response Utilities', () => {
  describe('respondWithSuccess', () => {
    it('formats a success response correctly', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const data = { id: 1, name: 'Test' };
      respondWithSuccess(res, 200, 'Success message', data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        data,
      });
    });

    it('includes pagination when provided', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };
      
      respondWithSuccess(res, 200, 'Success with pagination', data, pagination);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success with pagination',
        data,
        pagination,
      });
    });
  });

  describe('respondWithError', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('formats an error response correctly', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      respondWithError(res, 400, 'Error message');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error message',
      });
    });

    it('includes error details in development mode', () => {
      process.env.NODE_ENV = 'development';
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      respondWithError(res, 400, 'Error message', 'Error details');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error message',
        errors: 'Error details',
      });
    });

    it('omits error details in production mode', () => {
      process.env.NODE_ENV = 'production';
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      respondWithError(res, 400, 'Error message', 'Error details');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error message',
      });
    });

    it('sanitizes internal server error messages in production', () => {
      process.env.NODE_ENV = 'production';
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      respondWithError(res, 500, 'Database connection failed', 'Error details');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Une erreur interne est survenue',
      });
    });
  });

  describe('createPagination', () => {
    it('creates a pagination object with correct values', () => {
      const page = 2;
      const limit = 10;
      const total = 25;

      const pagination = createPagination(page, limit, total);

      expect(pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3, // 25 / 10 = 2.5, rounded up to 3
      });
    });

    it('handles string inputs by converting to integers', () => {
      const page = '2';
      const limit = '10';
      const total = 25;

      const pagination = createPagination(page, limit, total);

      expect(pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('calculates correct number of pages', () => {
      // Exact division
      expect(createPagination(1, 5, 15).totalPages).toBe(3);

      // Division with remainder
      expect(createPagination(1, 10, 25).totalPages).toBe(3);

      // Small dataset
      expect(createPagination(1, 10, 5).totalPages).toBe(1);

      // Empty dataset
      expect(createPagination(1, 10, 0).totalPages).toBe(0);
    });
  });
});