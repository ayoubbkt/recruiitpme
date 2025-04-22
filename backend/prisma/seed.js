const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data
  await prisma.note.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared');

  // Create user
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const demo = await prisma.user.create({
    data: {
      email: 'demo@recruitpme.com',
      passwordHash,
      firstName: 'Marie',
      lastName: 'Dubois',
      companyName: 'TechStart PME',
      emailVerified: true,
      lastLogin: new Date()
    }
  });

  console.log('Demo user created');

  // Create jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Développeur Full Stack',
      description: `
## Description du poste

Nous recherchons un développeur Full Stack passionné pour rejoindre notre équipe. Vous travaillerez sur le développement de nouvelles fonctionnalités et l'amélioration de notre plateforme existante.

## Responsabilités

- Développer des fonctionnalités front-end et back-end
- Collaborer avec les designers et les product managers
- Participer aux revues de code et au debugging
- Contribuer à l'architecture technique

## Profil recherché

- 3+ ans d'expérience en développement web
- Maîtrise de JavaScript/TypeScript, React, Node.js
- Expérience avec les bases de données SQL et NoSQL
- Connaissances en DevOps (CI/CD, Docker) est un plus
      `,
      location: 'Paris, France',
      contractType: 'cdi',
      salary: '45000-55000€',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git'],
      experienceLevel: 'intermediate',
      languages: 'Français, Anglais',
      startDate: new Date('2025-06-01'),
      pipelineStages: [
        'À contacter',
        'Entretien RH',
        'Test technique',
        'Entretien final',
        'Proposition',
        'Embauché'
      ],
      status: 'active',
      userId: demo.id
    }
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'UX Designer Senior',
      description: `
## Description du poste

Nous cherchons un UX Designer Senior pour concevoir des expériences utilisateur exceptionnelles pour nos produits digitaux.

## Responsabilités

- Conduire les recherches utilisateurs et analyser les besoins
- Créer des wireframes, prototypes et maquettes
- Collaborer avec les développeurs et product managers
- Définir et appliquer les standards UX de l'entreprise

## Profil recherché

- 5+ ans d'expérience en UX Design
- Maîtrise des outils de design (Figma, Sketch)
- Expérience en recherche utilisateur
- Excellent sens de la communication
      `,
      location: 'Lyon, France',
      contractType: 'cdi',
      salary: '50000-60000€',
      skills: ['Figma', 'UI Design', 'User Research', 'Wireframing', 'Prototyping'],
      experienceLevel: 'senior',
      languages: 'Français',
      startDate: new Date('2025-05-15'),
      pipelineStages: [
        'À contacter',
        'Premier entretien',
        'Présentation de portfolio',
        'Entretien final',
        'Proposition',
        'Embauché'
      ],
      status: 'active',
      userId: demo.id
    }
  });

  const job3 = await prisma.job.create({
    data: {
      title: 'Développeur Frontend React',
      description: `
## Description du poste

Nous recherchons un développeur Frontend React pour renforcer notre équipe produit.

## Responsabilités

- Développer des interfaces utilisateur avec React
- Implémenter des designs responsive
- Optimiser les performances frontend
- Participer à l'amélioration continue de notre design system

## Profil recherché

- 2+ ans d'expérience en développement frontend
- Maîtrise de React, Redux, et TypeScript
- Connaissance approfondie du HTML/CSS moderne
- Sensibilité UI/UX
      `,
      location: 'Télétravail',
      contractType: 'freelance',
      salary: '400-500€ / jour',
      skills: ['React', 'Redux', 'TypeScript', 'HTML', 'CSS', 'Responsive Design'],
      experienceLevel: 'intermediate',
      languages: 'Français, Anglais',
      startDate: null,
      pipelineStages: [
        'À contacter',
        'Test technique',
        'Entretien',
        'Proposition',
        'Embauché'
      ],
      status: 'active',
      userId: demo.id
    }
  });

  console.log('Demo jobs created');

  // Create candidates for job 1
  const candidate1 = await prisma.candidate.create({
    data: {
      name: 'Sophie Martin',
      email: 'sophie.martin@example.com',
      phone: '+33 6 12 34 56 78',
      resumeUrl: 'uploads/demo/sophie_martin_cv.pdf',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript'],
      experience: 5,
      education: 'Master en Informatique, Université Paris-Saclay',
      matchingScore: 92,
      status: 'interview',
      lastActivity: new Date('2025-04-18'),
      jobId: job1.id,
      userId: demo.id
    }
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      name: 'Thomas Leroy',
      email: 'thomas.leroy@example.com',
      phone: '+33 6 23 45 67 89',
      resumeUrl: 'uploads/demo/thomas_leroy_cv.pdf',
      skills: ['JavaScript', 'Vue.js', 'Express', 'PostgreSQL', 'Docker'],
      experience: 4,
      education: 'École d\'ingénieur, EPITA',
      matchingScore: 88,
      status: 'new',
      lastActivity: new Date('2025-04-19'),
      jobId: job1.id,
      userId: demo.id
    }
  });

  const candidate3 = await prisma.candidate.create({
    data: {
      name: 'Nicolas Fournier',
      email: 'nicolas.fournier@example.com',
      phone: '+33 6 34 56 78 90',
      resumeUrl: 'uploads/demo/nicolas_fournier_cv.pdf',
      skills: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'Vue.js'],
      experience: 2,
      education: 'BTS Informatique',
      matchingScore: 67,
      status: 'rejected',
      lastActivity: new Date('2025-04-14'),
      jobId: job1.id,
      userId: demo.id
    }
  });

  // Create candidates for job 2
  const candidate4 = await prisma.candidate.create({
    data: {
      name: 'Emma Bernard',
      email: 'emma.bernard@example.com',
      phone: '+33 6 45 67 89 01',
      resumeUrl: 'uploads/demo/emma_bernard_cv.pdf',
      skills: ['Figma', 'Sketch', 'User Research', 'Wireframing', 'Prototyping'],
      experience: 6,
      education: 'Master en Design Numérique, Gobelins',
      matchingScore: 85,
      status: 'new',
      lastActivity: new Date('2025-04-20'),
      jobId: job2.id,
      userId: demo.id
    }
  });

  const candidate5 = await prisma.candidate.create({
    data: {
      name: 'Camille Petit',
      email: 'camille.petit@example.com',
      phone: '+33 6 56 78 90 12',
      resumeUrl: 'uploads/demo/camille_petit_cv.pdf',
      skills: ['Adobe XD', 'User Testing', 'UI Design', 'Accessibility', 'HTML/CSS'],
      experience: 3,
      education: 'Bachelor en Design, ECV Digital',
      matchingScore: 72,
      status: 'toContact',
      lastActivity: new Date('2025-04-15'),
      jobId: job2.id,
      userId: demo.id
    }
  });

  // Create candidates for job 3
  const candidate6 = await prisma.candidate.create({
    data: {
      name: 'Julie Lambert',
      email: 'julie.lambert@example.com',
      phone: '+33 6 67 89 01 23',
      resumeUrl: 'uploads/demo/julie_lambert_cv.pdf',
      skills: ['React', 'Redux', 'TypeScript', 'CSS-in-JS', 'Testing'],
      experience: 3,
      education: 'Licence Informatique, Université Lyon 1',
      matchingScore: 81,
      status: 'interview',
      lastActivity: new Date('2025-04-16'),
      jobId: job3.id,
      userId: demo.id
    }
  });

  console.log('Demo candidates created');

  // Create notes
  await prisma.note.create({
    data: {
      content: 'Excellente candidate, forte expérience en React et Node.js',
      candidateId: candidate1.id,
      userId: demo.id
    }
  });

  await prisma.note.create({
    data: {
      content: 'À inviter pour un test technique',
      candidateId: candidate1.id,
      userId: demo.id
    }
  });

  await prisma.note.create({
    data: {
      content: 'Bonne expertise technique mais manque d\'expérience avec notre stack',
      candidateId: candidate3.id,
      userId: demo.id
    }
  });

  await prisma.note.create({
    data: {
      content: 'Portfolio impressionnant, expérience dans le secteur e-commerce intéressante',
      candidateId: candidate4.id,
      userId: demo.id
    }
  });

  console.log('Demo notes created');

  // Create interviews
  await prisma.interview.create({
    data: {
      date: new Date('2025-04-25T14:30:00Z'),
      location: 'Google Meet',
      notes: 'Premier entretien, présenter l\'équipe et les projets',
      status: 'scheduled',
      candidateId: candidate1.id,
      jobId: job1.id,
      interviewerId: demo.id
    }
  });

  await prisma.interview.create({
    data: {
      date: new Date('2025-04-27T10:00:00Z'),
      location: 'Bureaux de Paris',
      notes: 'Présentation de portfolio et discussion technique',
      status: 'scheduled',
      candidateId: candidate6.id,
      jobId: job3.id,
      interviewerId: demo.id
    }
  });

  console.log('Demo interviews created');

  console.log('Database seeded successfully');
}

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });