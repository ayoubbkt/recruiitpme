import { rest } from 'msw';

export const handlers = [
  // Auth handlers
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as { email: string; password: string };

    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Connexion réussie',
          data: {
            token: 'fake-jwt-token',
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              companyName: 'Test Company',
            },
          },
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          companyName: 'Test Company',
        },
      })
    );
  }),

  // Jobs handlers
  rest.get('/api/jobs', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Offres récupérées avec succès',
        data: [
          {
            id: '1',
            title: 'Développeur Full Stack',
            location: 'Paris, France',
            contractType: 'cdi',
            status: 'active',
            candidates: { total: 5 },
            createdAt: '2023-01-01T00:00:00Z',
          },
          {
            id: '2',
            title: 'UX Designer',
            location: 'Lyon, France',
            contractType: 'cdd',
            status: 'active',
            candidates: { total: 3 },
            createdAt: '2023-01-02T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      })
    );
  }),

  // Candidates handlers
  rest.get('/api/candidates', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Candidats récupérés avec succès',
        data: [
          {
            id: '1',
            name: 'Jean Dupont',
            email: 'jean@example.com',
            jobTitle: 'Développeur Full Stack',
            matchingScore: 85,
            status: 'new',
            skills: ['JavaScript', 'React', 'Node.js'],
            lastActivity: '2023-01-10T00:00:00Z',
          },
          {
            id: '2',
            name: 'Marie Martin',
            email: 'marie@example.com',
            jobTitle: 'Développeur Full Stack',
            matchingScore: 90,
            status: 'interview',
            skills: ['JavaScript', 'React', 'TypeScript'],
            lastActivity: '2023-01-11T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      })
    );
  }),

  // Interviews handlers
  rest.get('/api/interviews', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Entretiens récupérés avec succès',
        data: [
          {
            id: '1',
            candidateId: '1',
            candidateName: 'Jean Dupont',
            jobId: '1',
            jobTitle: 'Développeur Full Stack',
            date: '2023-02-15',
            time: '10:00',
            interviewer: 'Marie Dubois',
            status: 'scheduled',
            createdAt: '2023-01-15T00:00:00Z',
            updatedAt: '2023-01-15T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      })
    );
  }),

  // Analytics handlers
  rest.get('/api/analytics/dashboard', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Statistiques du tableau de bord récupérées avec succès',
        data: {
          activeJobs: 3,
          candidatesAnalyzed: 10,
          matchingRate: 85,
          interviews: 5,
          jobsTrend: 20,
          candidatesTrend: 15,
          matchingRateTrend: 5,
          interviewsTrend: 10,
          recentCandidates: [],
          tasks: [],
        },
      })
    );
  }),
];