import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Register from '../../pages/auth/Register';

// Mock the useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Register Page', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    );
  });

  it('renders the registration form correctly', () => {
    expect(screen.getByRole('heading', { name: /create a company account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('displays validation errors when form is submitted without data', async () => {
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /register/i });
    
    await user.click(submitButton);
    
    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email format', async () => {
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /register/i });
    
    // Fill in other required fields to isolate the email validation
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.type(screen.getByLabelText(/company name/i), 'Test Company');
    await user.click(screen.getByLabelText(/terms/i));
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for short password', async () => {
    const user = userEvent.setup();
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });
    
    // Fill in other required fields to isolate the password validation
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/company name/i), 'Test Company');
    await user.click(screen.getByLabelText(/terms/i));
    
    await user.type(passwordInput, 'short');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('successfully submits form with valid data', async () => {
    const user = userEvent.setup();
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const companyNameInput = screen.getByLabelText(/company name/i);
    const termsCheckbox = screen.getByLabelText(/terms/i);
    const submitButton = screen.getByRole('button', { name: /register/i });
    
    await user.type(firstNameInput, 'Test');
    await user.type(lastNameInput, 'User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
await user.type(companyNameInput, 'Test Company');
await user.click(termsCheckbox);

await user.click(submitButton);

await waitFor(() => {
  expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  // Other validation errors should also be absent
});
});
it('navigates to login page when "Login" link is clicked', () => {
const loginLink = screen.getByText(/login/i);
expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
});
});