const { generateToken, daysBetweenDates, getCvFileUrl, extractCvInfo, calculateMatchingScore } = require('../../utils/helpers');
  
  describe('Helpers', () => {
    describe('generateToken', () => {
      it('generates a token of the correct length', () => {
        const token = generateToken();
        // Default size is 32 bytes, which translates to 64 hex characters
        expect(token).toHaveLength(64);
      });
  
      it('generates a token of the specified length', () => {
        const token = generateToken(16);
        // 16 bytes = 32 hex characters
        expect(token).toHaveLength(32);
      });
  
      it('generates unique tokens on each call', () => {
        const token1 = generateToken();
        const token2 = generateToken();
        expect(token1).not.toEqual(token2);
      });
    });
  
    describe('daysBetweenDates', () => {
      it('calculates the number of days between two dates', () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-10');
        expect(daysBetweenDates(startDate, endDate)).toBe(9);
      });
  
      it('uses the current date as the end date if not provided', () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 5);
        expect(daysBetweenDates(startDate)).toBe(5);
      });
  
      it('returns positive days even when end date is before start date', () => {
        const startDate = new Date('2023-01-10');
        const endDate = new Date('2023-01-01');
        expect(daysBetweenDates(startDate, endDate)).toBe(9);
      });
    });
  
    describe('getCvFileUrl', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        process.env.AWS_BUCKET_NAME = 'test-bucket';
        process.env.AWS_REGION = 'eu-west-1';
      });
  
      it('returns a local path in development environment', () => {
        const fileName = 'cv-123.pdf';
        expect(getCvFileUrl(fileName)).toBe('/uploads/cvs/cv-123.pdf');
      });
  
      it('returns an S3 URL in production environment', () => {
        process.env.NODE_ENV = 'production';
        const fileName = 'cv-123.pdf';
        const expectedUrl = `https://test-bucket.s3.eu-west-1.amazonaws.com/cvs/${fileName}`;
        expect(getCvFileUrl(fileName)).toBe(expectedUrl);
      });
    });
  
    describe('extractCvInfo', () => {
      it('extracts information from CV data with all fields', () => {
        const cvData = {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+33 123456789',
          location: 'Paris, France',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 5,
          education: [{ degree: 'Master', institution: 'University' }],
          workExperience: [{ position: 'Developer', company: 'Tech Co' }],
          languages: ['English', 'French'],
        };
  
        const result = extractCvInfo(cvData);
        expect(result).toEqual(cvData);
      });
  
      it('handles missing fields', () => {
        const cvData = {
          name: 'John Doe',
          // email, phone, etc. are missing
        };
  
        const result = extractCvInfo(cvData);
        expect(result).toEqual({
          name: 'John Doe',
          email: '',
          phone: '',
          location: '',
          skills: [],
          experience: 0,
          education: [],
          workExperience: [],
          languages: [],
        });
      });
    });
  
    describe('calculateMatchingScore', () => {
      it('calculates a perfect match', () => {
        const candidate = {
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 5,
          languages: ['English', 'French'],
        };
  
        const job = {
          skills: ['JavaScript', 'React', 'Node.js'],
          experienceLevel: 'intermediate', // 3 years required
          languages: 'English, French',
        };
  
        const score = calculateMatchingScore(candidate, job);
        expect(score).toBe(100);
      });
  
      it('calculates a partial match', () => {
        const candidate = {
          skills: ['JavaScript', 'React'], // Missing Node.js
          experience: 2, // Less than required
          languages: ['English'], // Missing French
        };
  
        const job = {
          skills: ['JavaScript', 'React', 'Node.js'],
          experienceLevel: 'intermediate', // 3 years required
          languages: 'English, French',
        };
  
        const score = calculateMatchingScore(candidate, job);
        // Should be less than 100
        expect(score).toBeLessThan(100);
      });
  
      it('returns 0 when no job skills are provided', () => {
        const candidate = {
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 5,
          languages: ['English', 'French'],
        };
  
        const job = {
          skills: [], // No skills
          experienceLevel: 'intermediate',
          languages: 'English, French',
        };
        
  
        const score = calculateMatchingScore(candidate, job);
        expect(score).toBe(0);
      });
    });
  });