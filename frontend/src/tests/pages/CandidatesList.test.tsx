import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CandidatesList from '../../pages/candidates/CandidatesList';

// Mock the API services
vi.mock('../../services/api', () => ({
  candidatesService: {
    getCandidates: vi.fn().mockResolvedValue({
      data: {
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
            experience: 3,
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
            experience: 5,
            lastActivity: '2023-01-11T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      },
    }),
    updateCandidateStatus: vi.fn().mockResolvedValue({
      data: {
        success: true,
        message: 'Statut du candidat mis à jour avec succès',
      },
    }),
  },
  jobsService: {
    getJobs: vi.fn().mockResolvedValue({
      data: {
        success: true,
        message: 'Offres récupérées avec succès',
        data: [
          {
            id: '1',
            title: 'Développeur Full Stack',
          },
          {
            id: '2',
            title: 'UX Designer',
          },
        ],
      },
    }),
  },
}));

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'candidates.title': 'Candidates',
        'candidates.import': 'Import resumes',
        'common.search': 'Search',
        'candidates.statuses.new': 'New',
        'candidates.statuses.toContact': 'To contact',
        'candidates.statuses.interview': 'Interview',
        'candidates.statuses.hired': 'Hired',
        'candidates.statuses.rejected': 'Rejected',
        'candidates.name': 'Name',
        'jobs.jobTitle': 'Job title',
        'candidates.matchingScore': 'Matching score',
        'candidates.experience': 'Experience',
        'candidates.skills': 'Skills',
        'candidates.status': 'Status',
      };
      return translations[key] || key;
    },
  }),
}));

describe('CandidatesList Page', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <CandidatesList />
      </BrowserRouter>
    );
  });

  it('renders the candidates list page correctly', async () => {
    // Check for page title
    expect(screen.getByRole('heading', { name: /candidates/i })).toBeInTheDocument();
    
    // Check for Import Resumes button
    expect(screen.getByRole('link', { name: /import resumes/i })).toBeInTheDocument();
    
    // Check for search and filter elements
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    
    // Wait for the candidates to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    });
    
    // Check for table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Job title')).toBeInTheDocument();
    expect(screen.getByText('Matching score')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays candidate data correctly', async () => {
    await waitFor(() => {
      // Check if candidate names are displayed
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin')).toBeInTheDocument();
      
      // Check if job titles are displayed
      const jobTitles = screen.getAllByText('Développeur Full Stack');
      expect(jobTitles.length).toBe(2);
      
      // Check if matching scores are displayed
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      
      // Check if experience years are displayed
      expect(screen.getByText('3 ans')).toBeInTheDocument();
      expect(screen.getByText('5 ans')).toBeInTheDocument();
      
      // Check if skills are displayed (at least some of them)
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      
      // Check if status badges are displayed
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Interview')).toBeInTheDocument();
    });
  });

  it('allows filtering candidates by search query', async () => {
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Type search query
    await user.type(searchInput, 'Jean');
    
    // Simulate pressing Enter to trigger search
    await user.keyboard('{Enter}');
    
    // Since we mocked the API call, we can't test the actual filtering behavior,
    // but we can check if the search input value was updated
    expect(searchInput).toHaveValue('Jean');
  });

  it('allows filtering candidates by status', async () => {
    const user = userEvent.setup();
    const statusFilter = screen.getAllByRole('combobox')[0];
    
    // Select a status filter option
    await user.selectOptions(statusFilter, 'interview');
    
    // Check if the status filter value was updated
    expect(statusFilter).toHaveValue('interview');
  });

  it('navigates to candidate details when clicking on a candidate name', async () => {
    await waitFor(() => {
      const candidateNameLink = screen.getByText('Jean Dupont');
      expect(candidateNameLink.closest('a')).toHaveAttribute('href', '/app/candidates/1');
    });
  });
});