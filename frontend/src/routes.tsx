import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard';
import JobsList from './pages/jobs/JobsList';
import JobCreate from './pages/jobs/JobCreate';
import JobDetail from './pages/jobs/JobDetail';
import JobEdit from './pages/jobs/JobEdit';
import CandidatesList from './pages/candidates/CandidatesList';
import CandidateImport from './pages/candidates/CandidateImport';
import CandidateDetail from './pages/candidates/CandidateDetail';
import InterviewsList from './pages/interviews/InterviewsList';
import InterviewCreate from './pages/interviews/InterviewCreate';
import InterviewDetail from './pages/interviews/InterviewDetail';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Error pages
import NotFound from './pages/error/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <AuthLayout />,
        children: [
          { index: true, element: <Login /> },
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: 'forgot-password', element: <ForgotPassword /> },
          { path: 'reset-password', element: <ResetPassword /> },
        ],
      },
      {
        path: '/app',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'onboarding', element: <OnboardingPage /> },
          { path: 'jobs', element: <JobsList /> },
          { path: 'jobs/create', element: <JobCreate /> },
          { path: 'jobs/:id', element: <JobDetail /> },
          { path: 'jobs/:id/edit', element: <JobEdit /> },
          { path: 'candidates', element: <CandidatesList /> },
          { path: 'candidates/import', element: <CandidateImport /> },
          { path: 'candidates/:id', element: <CandidateDetail /> },
          { path: 'interviews', element: <InterviewsList /> },
          { path: 'interviews/create', element: <InterviewCreate /> },
          { path: 'interviews/:id', element: <InterviewDetail /> },
          { path: 'reports', element: <Reports /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;