const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Interview Database Integration', () => {
  let testUser;
  let testJob;
  let testCandidate;
  let testInterview;

  // Setup before tests
  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-interview-db@example.com',
        passwordHash: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        emailVerified: true
      }
    });

    // Create test job
    testJob = await prisma.job.create({
      data: {
        title: 'Test Job',
        location: 'Test Location',
        contractType: 'cdi',
        experienceLevel: 'intermediate',
        description: 'Test description',
        skills: ['JavaScript', 'React'],
        pipelineStages: ['À contacter', 'Entretien', 'Embauché'],
        status: 'active',
        userId: testUser.id
      }
    });

    // Create test candidate
    testCandidate = await prisma.candidate.create({
      data: {
        name: 'Test Candidate',
        email: 'test-candidate@example.com',
        phone: '123456789',
        skills: ['JavaScript', 'React'],
        experience: 3,
        matchingScore: 85,
        status: 'new',
        cvFile: 'test-cv.pdf',
        jobId: testJob.id,
        userId: testUser.id
      }
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    // Clean up test data
    await prisma.interview.deleteMany({
      where: {
        candidateId: testCandidate.id
      }
    });
    await prisma.candidate.delete({
      where: {
        id: testCandidate.id
      }
    });
    await prisma.job.delete({
      where: {
        id: testJob.id
      }
    });
    await prisma.user.delete({
      where: {
        id: testUser.