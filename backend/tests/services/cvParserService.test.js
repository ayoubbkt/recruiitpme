const fs = require('fs');
const axios = require('axios');
const cvParserService = require('../../services/cvParserService');
const logger = require('../../utils/logger');
const { extractCvInfo } = require('../../utils/helpers');

// Mocks
jest.mock('fs', () => ({
  readFile: jest.fn(),
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content'))
  }
}));

jest.mock('axios', () => ({
  post: jest.fn().mockImplementation((url, data) => {
    // Simuler une réponse réussie par défaut
    return Promise.resolve({
      status: 200,
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 3
      }
    });
  })
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../utils/helpers', () => ({
  extractCvInfo: jest.fn(data => data)
}));

describe('CV Parser Service', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.CV_PARSER_SERVICE_URL = 'http://cv-parser-service.local';
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCV', () => {
    it('should parse CV in development environment', async () => {
      // Arrange
      const filePath = 'john_doe_cv.pdf';
      const fileBuffer = Buffer.from('mock file content');
      const mockCvData = {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 3
      };

      fs.promises.readFile.mockResolvedValue(fileBuffer);
      axios.post.mockResolvedValue({
        status: 200,
        data: mockCvData
      });

      // Act
      const result = await cvParserService.parseCV(filePath);

      // Assert
      expect(fs.promises.readFile).toHaveBeenCalledWith(expect.stringContaining(filePath));
      expect(axios.post).toHaveBeenCalledWith(
        'http://cv-parser-service.local',
        expect.objectContaining({
          file_content: expect.any(String),
          file_type: 'pdf',
          file_name: 'john_doe_cv.pdf'
        }),
        expect.any(Object)
      );
      expect(extractCvInfo).toHaveBeenCalledWith(mockCvData);
      expect(result).toEqual(mockCvData);
    });

    it('should parse CV in production environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const filePath = 's3://bucket/cvs/john_doe_cv.pdf';
      const mockCvData = {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 3
      };

      axios.post.mockResolvedValue({
        status: 200,
        data: mockCvData
      });

      // Act
      const result = await cvParserService.parseCV(filePath);

      // Assert
      expect(fs.promises.readFile).not.toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledWith(
        'http://cv-parser-service.local',
        expect.objectContaining({
          file_key: filePath,
          file_type: 'pdf'
        }),
        expect.any(Object)
      );
      expect(extractCvInfo).toHaveBeenCalledWith(mockCvData);
      expect(result).toEqual(mockCvData);
    });

    it('should use backup parsing if service is unavailable', async () => {
      // Arrange
      const filePath = 'DUPONT_Jean_CV.pdf';
      const fileBuffer = Buffer.from('mock file content');

      fs.promises.readFile.mockResolvedValue(fileBuffer);
      axios.post.mockRejectedValue({ code: 'ECONNREFUSED' });

      // Important: Assurez-vous que le service a une fonction de secours (performBackupParsing)
      // qui est appelée correctement en cas d'échec
      
      // Act
      const result = await cvParserService.parseCV(filePath);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Utilisation de l\'analyse de secours');
      expect(result).toHaveProperty('name', expect.stringContaining('Jean'));
    });

    it('should throw error if parsing fails and fallback not applicable', async () => {
      // Arrange
      const filePath = 'john_doe_cv.pdf';
      const fileBuffer = Buffer.from('mock file content');
      const error = new Error('Internal server error');

      fs.promises.readFile.mockResolvedValue(fileBuffer);
      axios.post.mockRejectedValue(error);  // Rejeter avec une erreur générique, pas ECONNREFUSED

      // Act & Assert
      await expect(cvParserService.parseCV(filePath)).rejects.toThrow('Erreur lors de l\'analyse du CV');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('parseBatch', () => {
    it('should parse multiple CVs', async () => {
      // Arrange
      const filePaths = ['john_doe_cv.pdf', 'jane_smith_cv.pdf'];
      const mockResults = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 3
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          skills: ['JavaScript', 'Angular', 'Python'],
          experience: 5
        }
      ];

      // Mock parseCV pour retourner différents résultats en fonction du chemin
      jest.spyOn(cvParserService, 'parseCV')
        .mockImplementation((filePath) => {
          if (filePath === 'john_doe_cv.pdf') return Promise.resolve(mockResults[0]);
          if (filePath === 'jane_smith_cv.pdf') return Promise.resolve(mockResults[1]);
          return Promise.reject(new Error('Unknown file'));
        });

      // Act
      const results = await cvParserService.parseBatch(filePaths);

      // Assert
      expect(cvParserService.parseCV).toHaveBeenCalledTimes(2);
      expect(cvParserService.parseCV).toHaveBeenCalledWith('john_doe_cv.pdf');
      expect(cvParserService.parseCV).toHaveBeenCalledWith('jane_smith_cv.pdf');
      expect(results).toEqual([
        {
          filePath: 'john_doe_cv.pdf',
          success: true,
          data: mockResults[0]
        },
        {
          filePath: 'jane_smith_cv.pdf',
          success: true,
          data: mockResults[1]
        }
      ]);
    });

    it('should handle parse errors for individual files', async () => {
      // Arrange
      const filePaths = ['valid_cv.pdf', 'error_cv.pdf'];
      const mockResult = {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React'],
        experience: 3
      };
      const mockError = new Error('Failed to parse CV');

      // Mock parseCV pour réussir pour le premier fichier et échouer pour le second
      jest.spyOn(cvParserService, 'parseCV')
        .mockImplementation((filePath) => {
          if (filePath === 'valid_cv.pdf') return Promise.resolve(mockResult);
          if (filePath === 'error_cv.pdf') return Promise.reject(mockError);
          return Promise.reject(new Error('Unknown file'));
        });

      // Act
      const results = await cvParserService.parseBatch(filePaths);

      // Assert
      expect(cvParserService.parseCV).toHaveBeenCalledTimes(2);
      expect(results).toEqual([
        {
          filePath: 'valid_cv.pdf',
          success: true,
          data: mockResult
        },
        {
          filePath: 'error_cv.pdf',
          success: false,
          error: mockError.message
        }
      ]);
    });
  });
});