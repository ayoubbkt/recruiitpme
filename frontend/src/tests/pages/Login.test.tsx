import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/auth/Login';

// Mock the useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  });

  it('renders the login form correctly', () => {
    expect(screen.getByRole('heading', { name: /login to recruitpme/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
  });

  it('displays validation errors when form is submitted without data', async () => {
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await user.click(submitButton);
    
    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email format', async () => {
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data', async () => {
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // You can't directly test navigation in this setup, but you can check if the form submission works
    // by mocking the login function and checking if it's called with the right arguments
    
    // For now, we'll just check if clicking the button doesn't show validation errors
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
    });
  });

  it('navigates to forgot password page when link is clicked', async () => {
    const user = userEvent.setup();
    const forgotPasswordLink = screen.getByText(/forgot password\?/i);
    
    // Since we can't directly test navigation, we'll check if the link has the correct href
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('navigates to register page when "Create an account" is clicked', async () => {
    const user = userEvent.setup();
    const createAccountLink = screen.getByText(/create an account/i);
    
    // Since we can't directly test navigation, we'll check if the link has the correct href
    expect(createAccountLink.closest('a')).toHaveAttribute('href', '/register');
  });
});