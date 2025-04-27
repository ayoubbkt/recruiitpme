const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Candidate Database Integration', () => {
  let testUser;
  let testJob;
  let testCandidate;

  // Setup before tests
  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-candidate-db@example.com',
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
  });

  // Cleanup after tests
  afterAll(async () => {
    // Clean up test data
    await prisma.candidate.deleteMany({
      where: {
        jobId: testJob.id
      }
    });
    await prisma.job.delete({
      where: {
        id: testJob.id
      }
    });
    await prisma.user.delete({
      where: {
        id: testUser.id
      }
    });
    await prisma.$disconnect();
  });

  it('should create a candidate', async () => {
    // Create a candidate
    testCandidate = await prisma.candidate.create({
      data: {
        name: 'Test Candidate',
        email: 'test-candidate@example.com',
        phone: '123456789',
        
        skills: ['JavaScript', 'React'],
        experience: 3,
        matchingScore: 85,
        status: 'new',
        resumeUrl: 'test-cv.pdf',
        jobId: testJob.id,
        userId: testUser.id
      }
    });

    // Check candidate was created correctly
    expect(testCandidate).toHaveProperty('id');
    expect(testCandidate.name).toBe('Test Candidate');
    expect(testCandidate.email).toBe('test-candidate@example.com');
    expect(testCandidate.skills).toEqual(['JavaScript', 'React']);
    expect(testCandidate.matchingScore).toBe(85);
    expect(testCandidate.status).toBe('new');
    expect(testCandidate.jobId).toBe(testJob.id);
    expect(testCandidate.userId).toBe(testUser.id);
  });

  it('should update candidate status', async () => {
    // Update candidate status
    const updatedCandidate = await prisma.candidate.update({
      where: {
        id: testCandidate.id
      },
      data: {
        status: 'interview',
        lastActivity: new Date()
      }
    });

    // Check status was updated
    expect(updatedCandidate.status).toBe('interview');
    expect(updatedCandidate.lastActivity.getTime()).toBeGreaterThan(testCandidate.lastActivity.getTime());
  });

  it('should add a note to a candidate', async () => {
    // Add a note
    const note = await prisma.note.create({
      data: {
        content: 'Test note',
        // author: 'Test User',
        candidateId: testCandidate.id,
        userId: testUser.id
      }
    });

    // Check note was created
    expect(note).toHaveProperty('id');
    expect(note.content).toBe('Test note');
    expect(note.candidateId).toBe(testCandidate.id);

    // Get candidate with notes
    const candidateWithNotes = await prisma.candidate.findUnique({
      where: {
        id: testCandidate.id
      },
      include: {
        notes: true
      }
    });

    // Check notes were included
    expect(candidateWithNotes.notes).toHaveLength(1);
    expect(candidateWithNotes.notes[0].content).toBe('Test note');
  });

  it('should delete a candidate', async () => {
    // Delete the candidate
    await prisma.candidate.delete({
      where: {
        id: testCandidate.id
      }
    });

    // Check candidate was deleted
    const deletedCandidate = await prisma.candidate.findUnique({
      where: {
        id: testCandidate.id
      }
    });

    expect(deletedCandidate).toBeNull();

    // Check notes were cascade deleted
    const notes = await prisma.note.findMany({
      where: {
        candidateId: testCandidate.id
      }
    });

    expect(notes).toHaveLength(0);
  });
});