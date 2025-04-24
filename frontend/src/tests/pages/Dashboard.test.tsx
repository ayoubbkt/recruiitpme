import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/dashboard/Dashboard';
import { AuthProvider } from '../../context/AuthContext';

// Mock the API service
vi.mock('../../services/api', () => ({
  analyticsService: {
    getDashboardStats: vi.fn().mockResolvedValue({
      data: {
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
          recentCandidates: [
            {
              id: '1',
              name: 'Jean Dupont',
              jobTitle: 'Développeur Full Stack',
              matchingScore: 85,
              status: 'new',
            },
            {
              id: '2',
              name: 'Marie Martin',
              jobTitle: 'UX Designer',
              matchingScore: 90,
              status: 'interview',
            },
          ],
          tasks: [
            {
              id: 'interview-1',
              title: 'Entretien avec Jean Dupont',
              type: 'interview',
              date: '2023-05-15',
            },
            {
              id: 'contact-1',
              title: 'Contacter Marie Martin',
              type: 'contact',
              date: '2023-05-10',
            },
          ],
        },
      },
    }),
  },
}));

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'dashboard.title': 'Dashboard',
        'dashboard.welcome': 'Welcome to RecrutPME',
        'dashboard.summary': 'Recruitment summary',
        'dashboard.activeJobs': 'Active Jobs',
        'dashboard.candidatesAnalyzed': 'CVs analyzed',
        'dashboard.matchingRate': 'Matching rate',
        'dashboard.interviews': 'Scheduled interviews',
        'dashboard.recentCandidates': 'Recent candidates',
        'dashboard.tasksTitle': 'Current tasks',
        'candidates.statuses.new': 'New',
        'candidates.statuses.interview': 'Interview',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the useAuth hook to return a user
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        firstName: 'Marie',
        lastName: 'Dubois',
      },
      isAuthenticated: true,
    }),
  };
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );
  });

  it('renders the dashboard page correctly', async () => {
    // Check for welcome message with user's name
    expect(screen.getByText(/welcome to recruitpme, marie/i)).toBeInTheDocument();
    
    // Wait for the stats to be loaded
    await waitFor(() => {
      // Check if key metrics are displayed
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByText('CVs analyzed')).toBeInTheDocument();
      expect(screen.getByText('Matching rate')).toBeInTheDocument();
      expect(screen.getByText('Scheduled interviews')).toBeInTheDocument();
      
      // Check if the metrics values are displayed
      expect(screen.getByText('3')).toBeInTheDocument(); // activeJobs
      expect(screen.getByText('10')).toBeInTheDocument(); // candidatesAnalyzed
      expect(screen.getByText('85%')).toBeInTheDocument(); // matchingRate
      expect(screen.getByText('5')).toBeInTheDocument(); // interviews
    });
  });

  it('displays recent candidates correctly', async () => {
    await waitFor(() => {
      // Check if the "Recent candidates" section is displayed
      expect(screen.getByText('Recent candidates')).toBeInTheDocument();
      
      // Check if candidate names are displayed
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin')).toBeInTheDocument();
      
      // Check if job titles are displayed
      expect(screen.getByText('Développeur Full Stack')).toBeInTheDocument();
      expect(screen.getByText('UX Designer')).toBeInTheDocument();
      
      // Check if status badges are displayed
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Interview')).toBeInTheDocument();
    });
  });

  it('displays tasks correctly', async () => {
    await waitFor(() => {
      // Check if the "Current tasks" section is displayed
      expect(screen.getByText('Current tasks')).toBeInTheDocument();
      
      // Check if task titles are displayed
      expect(screen.getByText('Entretien avec Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Contacter Marie Martin')).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', async () => {
    await waitFor(() => {
      // We can't easily check the trend arrows directly, but we can check the trend percentages
      expect(screen.getByText('20%')).toBeInTheDocument(); // jobsTrend
      expect(screen.getByText('15%')).toBeInTheDocument(); // candidatesTrend
      expect(screen.getByText('5%')).toBeInTheDocument(); // matchingRateTrend
      expect(screen.getByText('10%')).toBeInTheDocument(); // interviewsTrend
    });
  });
});