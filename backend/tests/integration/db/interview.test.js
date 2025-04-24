const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Interview Model Integration Tests', () => {
  let testUser;
  let testJob;
  let testCandidate;
  let testInterview;

  // Configuration avant les tests
  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = await prisma.user.create({
      data: {
        email: 'test-interview@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        emailVerified: true
      }
    });

    // Créer une offre d'emploi de test
    testJob = await prisma.job.create({
      data: {
        title: 'Test Job for Interviews',
        description: 'Description for test job',
        location: 'Test Location',
        contractType: 'cdi',
        experienceLevel: 'intermediate',
        skills: ['JavaScript', 'Node.js'],
        pipelineStages: ['Interview', 'Technical Test'],
        status: 'active',
        userId: testUser.id
      }
    });

    // Créer un candidat de test
    testCandidate = await prisma.candidate.create({
      data: {
        name: 'Test Candidate',
        email: 'candidate@example.com',
        phone: '1234567890',
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

  // Nettoyage après les tests
  afterAll(async () => {
    // Supprimer les données de test dans l'ordre inverse de leur création
    if (testInterview) {
      await prisma.interview.delete({ where: { id: testInterview.id } });
    }
    await prisma.candidate.delete({ where: { id: testCandidate.id } });
    await prisma.job.delete({ where: { id: testJob.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    // Fermer la connexion Prisma
    await prisma.$disconnect();
  });

  // Test de création d'un entretien
  it('should create a new interview', async () => {
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 7); // Date dans 7 jours
    
    testInterview = await prisma.interview.create({
      data: {
        date: interviewDate,
        location: 'Google Meet',
        notes: 'Test interview notes',
        status: 'scheduled',
        candidateId: testCandidate.id,
        jobId: testJob.id,
        interviewerId: testUser.id
      }
    });

    expect(testInterview).toBeDefined();
    expect(testInterview.status).toBe('scheduled');
    expect(testInterview.location).toBe('Google Meet');
    expect(testInterview.candidateId).toBe(testCandidate.id);
  });

  // Test de lecture d'un entretien
  it('should read an interview with related entities', async () => {
    const interview = await prisma.interview.findUnique({
      where: { id: testInterview.id },
      include: {
        candidate: true,
        job: true
      }
    });

    expect(interview).toBeDefined();
    expect(interview.candidate.name).toBe('Test Candidate');
    expect(interview.job.title).toBe('Test Job for Interviews');
  });

  // Test de mise à jour d'un entretien
  it('should update an interview', async () => {
    const updatedInterview = await prisma.interview.update({
      where: { id: testInterview.id },
      data: {
        status: 'completed',
        feedback: 'Great interview with the candidate'
      }
    });

    expect(updatedInterview).toBeDefined();
    expect(updatedInterview.status).toBe('completed');
    expect(updatedInterview.feedback).toBe('Great interview with the candidate');
  });

  // Test de récupération de tous les entretiens pour un candidat
  it('should retrieve all interviews for a candidate', async () => {
    const interviews = await prisma.interview.findMany({
      where: { candidateId: testCandidate.id }
    });

    expect(interviews).toBeDefined();
    expect(interviews.length).toBeGreaterThan(0);
    expect(interviews[0].id).toBe(testInterview.id);
  });

  // Test de suppression d'un entretien
  it('should delete an interview', async () => {
    await prisma.interview.delete({
      where: { id: testInterview.id }
    });

    const deletedInterview = await prisma.interview.findUnique({
      where: { id: testInterview.id }
    });

    expect(deletedInterview).toBeNull();
    
    // Pour éviter des erreurs dans afterAll
    testInterview = null;
  });
});