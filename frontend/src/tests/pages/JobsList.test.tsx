import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import JobsList from '../../pages/jobs/JobsList';

// Mock the API service
vi.mock('../../services/api', () => ({
  jobsService: {
    getJobs: vi.fn().mockResolvedValue({
      data: {
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
      },
    }),
    deleteJob: vi.fn().mockImplementation(() => Promise.resolve({ data: { success: true } })),
  },
}));

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'jobs.title': 'Job Listings',
        'jobs.createTitle': 'Create a job listing',
        'common.search': 'Search',
        'jobs.status.active': 'Active',
        'jobs.status.draft': 'Draft',
        'jobs.status.closed': 'Closed',
        'jobs.location': 'Location',
        'jobs.contract': 'Contract type',
        'candidates.title': 'Candidates',
        'candidates.status': 'Status',
      };
      return translations[key] || key;
    },
  }),
}));

describe('JobsList Page', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <JobsList />
      </BrowserRouter>
    );
  });

  it('renders the jobs list page correctly', async () => {
    // Check for page title
    expect(screen.getByRole('heading', { name: /job listings/i })).toBeInTheDocument();
    
    // Check for Create Job button
    expect(screen.getByRole('link', { name: /create a job listing/i })).toBeInTheDocument();
    
    // Check for search and filter elements
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    
    // Wait for the jobs to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText('Développeur Full Stack')).toBeInTheDocument();
      expect(screen.getByText('UX Designer')).toBeInTheDocument();
    });
    
    // Check for table headers
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Contract type')).toBeInTheDocument();
    expect(screen.getByText('Candidates')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays job data correctly', async () => {
    await waitFor(() => {
      // Check if job titles are displayed
      expect(screen.getByText('Développeur Full Stack')).toBeInTheDocument();
      expect(screen.getByText('UX Designer')).toBeInTheDocument();
      
      // Check if job locations are displayed
      expect(screen.getByText('Paris, France')).toBeInTheDocument();
      expect(screen.getByText('Lyon, France')).toBeInTheDocument();
      
      // Check if status badges are displayed
      const statusBadges = screen.getAllByText('Active');
      expect(statusBadges.length).toBe(2);
    });
  });

  it('allows filtering jobs by search query', async () => {
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Type search query
    await user.type(searchInput, 'Développeur');
    
    // Simulate pressing Enter to trigger search
    await user.keyboard('{Enter}');
    
    // Since we mocked the API call, we can't test the actual filtering behavior,
    // but we can check if the search input value was updated
    expect(searchInput).toHaveValue('Développeur');
  });

  it('allows filtering jobs by status', async () => {
    const user = userEvent.setup();
    const statusFilter = screen.getByRole('combobox');
    
    // Select a status filter option
    await user.selectOptions(statusFilter, 'draft');
    
    // Check if the status filter value was updated
    expect(statusFilter).toHaveValue('draft');
  });

  it('navigates to job details when clicking on a job title', async () => {
    await waitFor(() => {
      const jobTitleLink = screen.getByText('Développeur Full Stack');
      expect(jobTitleLink.closest('a')).toHaveAttribute('href', '/app/jobs/1');
    });
  });
});