const ApiError = require('../../utils/ApiError');

describe('ApiError Utility', () => {
  
  it('should create an instance with status code and message', () => {
    const statusCode = 400;
    const message = 'Bad Request';
    const error = new ApiError(statusCode, message);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(statusCode);
    expect(error.message).toBe(message);
    expect(error.isOperational).toBe(true); // Par défaut
  });
  
  it('should create an instance with custom isOperational flag', () => {
    const error = new ApiError(500, 'Internal Server Error', false);
    
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Internal Server Error');
    expect(error.isOperational).toBe(false);
  });
  
  it('should create an instance with custom stack trace', () => {
    const customStack = 'Custom stack trace';
    const error = new ApiError(404, 'Not Found', true, customStack);
    
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not Found');
    expect(error.stack).toBe(customStack);
  });
  
  it('should capture stack trace if not provided', () => {
    const error = new ApiError(403, 'Forbidden');
    
    expect(error.stack).toBeDefined();
    expect(error.stack.includes('ApiError.test.js')).toBe(true);
  });
  
  it('should be throwable and catchable', () => {
    expect(() => {
      throw new ApiError(400, 'Bad Request');
    }).toThrow(ApiError);
    
    try {
      throw new ApiError(400, 'Bad Request');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
    }
  });
  
  it('should preserve stack trace when thrown and caught', () => {
    let caughtError;
    
    try {
      // Définir une fonction qui lance une erreur
      const throwError = () => {
        throw new ApiError(500, 'Test Error');
      };
      throwError();
    } catch (error) {
      caughtError = error;
    }
    
    expect(caughtError).toBeInstanceOf(ApiError);
    expect(caughtError.stack).toBeDefined();
    // La trace de la pile devrait inclure la fonction throwError
    expect(caughtError.stack.includes('throwError')).toBe(true);
  });
});