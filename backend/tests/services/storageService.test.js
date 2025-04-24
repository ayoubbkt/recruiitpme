const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const storageService = require('../../services/storageService');

// Mocks
jest.mock('aws-sdk', () => {
    const mockS3Instance = {
      getSignedUrlPromise: jest.fn().mockResolvedValue('https://mocked-url.com/file.pdf'),
      deleteObject: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      }),
      copyObject: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      })
    };
  
  return {
    S3: jest.fn(() => mockS3Instance),
    config: {
      update: jest.fn()
    }
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  copyFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(path => path.substring(0, path.lastIndexOf('/')))
}));

jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

describe('Storage Service', () => {
  let originalNodeEnv;
  const mockS3 = new AWS.S3();

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('getFileUrl', () => {
    it('should return a signed URL in production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_BUCKET_NAME = 'test-bucket';
      
      const mockUrl = 'https://test-bucket.s3.region.amazonaws.com/cvs/test-file.pdf';
      mockS3.getSignedUrlPromise.mockResolvedValue(mockUrl);
      
      const url = await storageService.getFileUrl('cvs/test-file.pdf');
      
      expect(mockS3.getSignedUrlPromise).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'cvs/test-file.pdf'
        })
      );
      expect(url).toBe(mockUrl);
    });

    it('should return a local path in development environment', async () => {
      process.env.NODE_ENV = 'development';
      
      fs.existsSync.mockReturnValue(true);
      
      const url = await storageService.getFileUrl('cvs/test-file.pdf');
      
      expect(fs.existsSync).toHaveBeenCalled();
      expect(url).toBe('/uploads/cvs/test-file.pdf');
    });

    it('should throw error if file does not exist in development', async () => {
      process.env.NODE_ENV = 'development';
      
      fs.existsSync.mockReturnValue(false);
      
      await expect(storageService.getFileUrl('cvs/non-existent.pdf'))
        .rejects.toThrow(/Fichier non trouvé/);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from S3 in production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_BUCKET_NAME = 'test-bucket';
      
      const result = await storageService.deleteFile('cvs/test-file.pdf');
      
      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'cvs/test-file.pdf'
      });
      expect(result).toBe(true);
    });

    it('should delete a local file in development environment', async () => {
      process.env.NODE_ENV = 'development';
      
      fs.existsSync.mockReturnValue(true);
      
      const result = await storageService.deleteFile('cvs/test-file.pdf');
      
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if local file does not exist in development', async () => {
      process.env.NODE_ENV = 'development';
      
      fs.existsSync.mockReturnValue(false);
      
      const result = await storageService.deleteFile('cvs/non-existent.pdf');
      
      expect(result).toBe(false);
    });
  });

  describe('copyFile', () => {
    it('should copy a file in S3 in production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_BUCKET_NAME = 'test-bucket';
      
      const result = await storageService.copyFile(
        'cvs/source-file.pdf',
        'cvs/destination-file.pdf'
      );
      
      expect(mockS3.copyObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        CopySource: 'test-bucket/cvs/source-file.pdf',
        Key: 'cvs/destination-file.pdf'
      });
      expect(result).toBe(true);
    });

    it('should copy a local file in development environment', async () => {
      process.env.NODE_ENV = 'development';
      
      fs.existsSync.mockReturnValue(true);
      
      const result = await storageService.copyFile(
        'cvs/source-file.pdf',
        'cvs/destination-file.pdf'
      );
      
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.copyFileSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should create destination directory if it does not exist in development', async () => {
      process.env.NODE_ENV = 'development';
      
      fs.existsSync
        .mockReturnValueOnce(true)  // Source file exists
        .mockReturnValueOnce(false); // Destination directory does not exist
      
      const result = await storageService.copyFile(
        'cvs/source-file.pdf',
        'new-dir/destination-file.pdf'
      );
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(fs.copyFileSync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if source file does not exist in development', async () => {
      process.env.NODE_ENV = 'development';
      
      fs.existsSync.mockReturnValue(false);
      
      const result = await storageService.copyFile(
        'cvs/non-existent.pdf',
        'cvs/destination-file.pdf'
      );
      
      expect(result).toBe(false);
    });
  });
});