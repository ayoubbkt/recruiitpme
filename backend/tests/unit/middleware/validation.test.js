const Joi = require('joi');
const { validate } = require('../../../middleware/validation');

describe('Validation Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  describe('validate function', () => {
    it('should validate request body and call next if valid', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate request query and call next if valid', () => {
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
      });

      mockRequest.query = {
        page: '2',
        limit: '20'
      };

      const middleware = validate(schema, 'query');
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.query.page).toBe(2); // Converti en nombre
      expect(mockRequest.query.limit).toBe(20); // Converti en nombre
    });

    it('should validate request params and call next if valid', () => {
      const schema = Joi.object({
        id: Joi.string().required()
      });

      mockRequest.params = {
        id: 'test-id'
      };

      const middleware = validate(schema, 'params');
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 400 with errors if validation fails', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      mockRequest.body = {
        name: 'Test User',
        email: 'invalid-email'
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation échouée',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.stringContaining('email')
            })
          ])
        })
      );
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        unknownField: 'This should be stripped'
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({
        name: 'Test User',
        email: 'test@example.com'
      });
      expect(mockRequest.body.unknownField).toBeUndefined();
    });

    it('should return multiple validation errors', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(18).required()
      });

      mockRequest.body = {
        name: '',
        email: 'invalid-email',
        age: 16
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation échouée',
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'age' })
          ])
        })
      );
      expect(mockResponse.json.mock.calls[0][0].errors.length).toBe(3);
    });

    it('should apply default values when not provided', () => {
      const schema = Joi.object({
        name: Joi.string().default('Default Name'),
        age: Joi.number().default(25)
      });

      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body.name).toBe('Default Name');
      expect(mockRequest.body.age).toBe(25);
    });

    it('should handle custom Joi messages', () => {
      const schema = Joi.object({
        name: Joi.string().required().messages({
          'string.empty': 'Le nom ne peut pas être vide',
          'any.required': 'Le nom est obligatoire'
        }),
        email: Joi.string().email().required().messages({
          'string.email': 'Email invalide',
          'any.required': 'Email obligatoire'
        })
      });

      mockRequest.body = {
        name: '',
        email: 'invalid-email'
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      
      const errors = mockResponse.json.mock.calls[0][0].errors;
      expect(errors.find(e => e.field === 'name').message).toBe('Le nom ne peut pas être vide');
      expect(errors.find(e => e.field === 'email').message).toBe('Email invalide');
    });

    it('should handle validation with arrays', () => {
      const schema = Joi.object({
        tags: Joi.array().items(Joi.string()).min(1).required()
      });

      mockRequest.body = {
        tags: ['javascript', 'nodejs']
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body.tags).toEqual(['javascript', 'nodejs']);
    });

    it('should handle validation with nested objects', () => {
      const schema = Joi.object({
        user: Joi.object({
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          address: Joi.object({
            city: Joi.string().required(),
            country: Joi.string().required()
          }).required()
        }).required()
      });

      mockRequest.body = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          address: {
            city: 'Paris',
            country: 'France'
          }
        }
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body.user.firstName).toBe('John');
      expect(mockRequest.body.user.address.city).toBe('Paris');
    });

    it('should fail validation with nested objects', () => {
      const schema = Joi.object({
        user: Joi.object({
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          address: Joi.object({
            city: Joi.string().required(),
            country: Joi.string().required()
          }).required()
        }).required()
      });

      mockRequest.body = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          address: {
            city: 'Paris'
            // country missing
          }
        }
      };

      const middleware = validate(schema);
      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      
      const errors = mockResponse.json.mock.calls[0][0].errors;
      expect(errors[0].field).toBe('user.address.country');
    });

    it('should handle different data sources', () => {
      // Test avec source = body (par défaut)
      const bodySchema = Joi.object({
        name: Joi.string().required()
      });
      
      mockRequest.body = { name: 'Test' };
      
      const bodyMiddleware = validate(bodySchema);
      bodyMiddleware(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      nextFunction.mockClear();

      // Test avec source = query
      const querySchema = Joi.object({
        search: Joi.string().required()
      });
      
      mockRequest.query = { search: 'test' };
      
      const queryMiddleware = validate(querySchema, 'query');
      queryMiddleware(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      nextFunction.mockClear();

      // Test avec source = params
      const paramsSchema = Joi.object({
        id: Joi.string().required()
      });
      
      mockRequest.params = { id: '123' };
      
      const paramsMiddleware = validate(paramsSchema, 'params');
      paramsMiddleware(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});