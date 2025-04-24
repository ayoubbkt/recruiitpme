const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const jwt = require('jsonwebtoken');

// Import des routes
const analyticsRoutes = require('../../routes/analyticsRoutes');
// Import des middlewares
const errorHandler = require('../../middleware/errorHandler');

// Créer une application Express pour les tests
const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler);

describe('Analytics Routes Integration Tests', () => {
  let testUser;
  let testJob;
  let testCandidate;
  let authToken;

  // Avant tous les tests
  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = await prisma.user.create({
      data: {
        email: 'test-analytics@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        emailVerified: true
      }
    });

    // Générer un token JWT
    authToken = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Créer une offre d'emploi de test
    testJob = await prisma.job.create({
      data: {
        title: 'Test Job for Analytics',
        description: 'Test job description',
        location: 'Test Location',
        contractType: 'cdi',
        experienceLevel: 'intermediate',
        skills: ['JavaScript', 'Node.js'],
        pipelineStages: ['Applied', 'Interview'],
        status: 'active',
        userId: testUser.id
      }
    });

    // Créer un candidat de test
    testCandidate = await prisma.candidate.create({
      data: {
        name: 'Test Candidate for Analytics',
        email: 'analytics-candidate@example.com',
        resumeUrl: 'test-resume.pdf',
        skills: ['JavaScript', 'Node.js'],
        experience: 3,
        matchingScore: 85,
        status: 'interview',
        jobId: testJob.id,
        userId: testUser.id
      }
    });
  });

  // Après tous les tests
  afterAll(async () => {
    // Supprimer les données de test
    await prisma.candidate.delete({ where: { id: testCandidate.id } });
    await prisma.job.delete({ where: { id: testJob.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    // Fermer la connexion Prisma
    await prisma.$disconnect();
  });

  // Tests
  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // Vérifier la structure des données
      expect(response.body.data).toHaveProperty('activeJobs');
      expect(response.body.data).toHaveProperty('candidatesAnalyzed');
      expect(response.body.data).toHaveProperty('matchingRate');
      expect(response.body.data).toHaveProperty('interviews');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/jobs/:id', () => {
    it('should return job statistics', async () => {
      const response = await request(app)
        .get(`/api/analytics/jobs/${testJob.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // Vérifier la structure des données
      expect(response.body.data).toHaveProperty('totalCandidates');
      expect(response.body.data).toHaveProperty('conversionRate');
      expect(response.body.data).toHaveProperty('averageMatchingScore');
    });

    it('should return 404 for non-existent job', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await request(app)
        .get(`/api/analytics/jobs/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/analytics/conversion', () => {
    it('should return conversion statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/conversion')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // Vérifier la structure des données
      expect(response.body.data).toHaveProperty('stages');
      expect(response.body.data).toHaveProperty('conversionRates');
    });

    it('should filter by job id', async () => {
      const response = await request(app)
        .get(`/api/analytics/conversion?jobId=${testJob.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/reports', () => {
    it('should generate a report', async () => {
      const response = await request(app)
        .get('/api/analytics/reports')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // Vérifier la structure des données
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('dateRange');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('candidates');
    });

    it('should filter by period', async () => {
      const response = await request(app)
        .get('/api/analytics/reports?period=week')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe('week');
    });

    it('should filter by job id', async () => {
      const response = await request(app)
        .get(`/api/analytics/reports?jobId=${testJob.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});