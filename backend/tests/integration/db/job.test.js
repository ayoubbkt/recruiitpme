const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Job Database Integration', () => {
  let testUser;
  let testJob;

  // Setup before tests
  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-job-db@example.com',
        passwordHash: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        emailVerified: true
      }
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    // Clean up test data
    await prisma.job.deleteMany({
      where: {
        userId: testUser.id
      }
    });
    await prisma.user.delete({
      where: {
        id: testUser.id
      }
    });
    await prisma.$disconnect();
  });

  it('should create a job', async () => {
    // Create a job
    testJob = await prisma.job.create({
      data: {
        title: 'Full Stack Developer',
        location: 'Paris',
        contractType: 'cdi',
        salary: '45k-55k',
        experienceLevel: 'intermediate',
        startDate: new Date('2025-06-01'),
        languages: 'French, English',
        description: 'Test job description',
        skills: ['JavaScript', 'React', 'Node.js'],
        pipelineStages: ['À contacter', 'Entretien', 'Embauché'],
        status: 'active',
        userId: testUser.id
      }
    });

    // Check job was created correctly
    expect(testJob).toHaveProperty('id');
    expect(testJob.title).toBe('Full Stack Developer');
    expect(testJob.location).toBe('Paris');
    expect(testJob.skills).toEqual(['JavaScript', 'React', 'Node.js']);
    expect(testJob.pipelineStages).toEqual(['À contacter', 'Entretien', 'Embauché']);
    expect(testJob.status).toBe('active');
    expect(testJob.userId).toBe(testUser.id);
  });

  it('should update a job', async () => {
    // Update job
    const updatedJob = await prisma.job.update({
      where: {
        id: testJob.id
      },
      data: {
        title: 'Senior Full Stack Developer',
        location: 'Lyon',
        experienceLevel: 'senior',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        status: 'active'
      }
    });

    // Check job was updated
    expect(updatedJob.title).toBe('Senior Full Stack Developer');
    expect(updatedJob.location).toBe('Lyon');
    expect(updatedJob.experienceLevel).toBe('senior');
    expect(updatedJob.skills).toEqual(['JavaScript', 'React', 'Node.js', 'TypeScript']);
    expect(updatedJob.status).toBe('active');
  });

  it('should create candidates for a job', async () => {
    // Create candidates
    const candidate1 = await prisma.candidate.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 3,
        matchingScore: 90,
        status: 'new',
        resumeUrl: 'john_cv.pdf',
        jobId: testJob.id,
        userId: testUser.id
      }
    });

    const candidate2 = await prisma.candidate.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        skills: ['JavaScript', 'Angular'],
        experience: 5,
        matchingScore: 75,
        status: 'new',
        resumeUrl: 'jane_cv.pdf',
        jobId: testJob.id,
        userId: testUser.id
      }
    });

    // Get job with candidates
    const jobWithCandidates = await prisma.job.findUnique({
      where: {
        id: testJob.id
      },
      include: {
        candidates: true
      }
    });
    

    // Check candidates were created and linked to job
    expect(jobWithCandidates.candidates).toHaveLength(2);
    expect(jobWithCandidates.candidates.map(c => c.name)).toContain('John Doe');
    expect(jobWithCandidates.candidates.map(c => c.name)).toContain('Jane Smith');

    // Clean up candidates
    await prisma.candidate.deleteMany({
      where: {
        jobId: testJob.id
      }
    });
  });

  it('should delete a job', async () => {
    // Delete the job
    await prisma.job.delete({
      where: {
        id: testJob.id
      }
    });

    // Check job was deleted
    const deletedJob = await prisma.job.findUnique({
      where: {
        id: testJob.id
      }
    });

    expect(deletedJob).toBeNull();
  });
});