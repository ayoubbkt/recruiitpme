import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

// Mock the auth service
vi.mock('../../services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Setup and teardown
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  describe('AuthProvider', () => {
    it('renders children', () => {
      render(
        <AuthProvider>
          <div data-testid="test-child">Test Child</div>
        </AuthProvider>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
    
    it('initializes with isAuthenticated=false when no token in localStorage', () => {
      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    it('initializes with isLoading=true and then isLoading=false', async () => {
      const TestComponent = () => {
        const { isLoading } = useAuth();
        return <div data-testid="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</div>;
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Initially loading
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
      
      // Then not loading
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });
    });
    
    it('validates token and sets isAuthenticated=true when valid token exists', async () => {
      // Mock a valid token
      localStorage.setItem('token', 'valid-token');
      
      // Mock getProfile to return successfully
      vi.mocked(authService.getProfile).mockResolvedValue({
        data: {
          data: {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            companyName: 'Test Company',
          },
        },
      });
      
      const TestComponent = () => {
        const { isAuthenticated, isLoading } = useAuth();
        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
            <div data-testid="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</div>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Wait for the authentication check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });
      
      // Should be authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(authService.getProfile).toHaveBeenCalledTimes(1);
    });
    
    it('clears token and sets isAuthenticated=false when token is invalid', async () => {
      // Mock an invalid token
      localStorage.setItem('token', 'invalid-token');
      
      // Mock getProfile to reject
      vi.mocked(authService.getProfile).mockRejectedValue(new Error('Invalid token'));
      
      const TestComponent = () => {
        const { isAuthenticated, isLoading } = useAuth();
        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
            <div data-testid="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</div>
          </div>
        );
      };
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Wait for the authentication check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });
      
      // Should not be authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(authService.getProfile).toHaveBeenCalledTimes(1);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
  
  describe('useAuth hook', () => {
    it('login function sets token and user data on successful login', async () => {
      // Mock successful login
      vi.mocked(authService.login).mockResolvedValue({
        data: {
          data: {
            token: 'new-token',
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              companyName: 'Test Company',
            },
          },
        },
      });
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });
      
      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false);
      
      // Call login
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });
      
      // Should be authenticated with user data
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
      });
      
      // Should have set token in localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });
    
    it('register function calls authService.register', async () => {
      // Mock successful registration
      vi.mocked(authService.register).mockResolvedValue({
        data: {
          success: true,
          message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
        },
      });
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });
      
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
      };
      
      // Call register
      await act(async () => {
        await result.current.register(userData);
      });
      
      // Should call authService.register with userData
      expect(authService.register).toHaveBeenCalledWith(userData);
    });
    
    it('logout function clears token and user data', async () => {
      // Setup initial authenticated state
      localStorage.setItem('token', 'test-token');
      vi.mocked(authService.getProfile).mockResolvedValue({
        data: {
          data: {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            companyName: 'Test Company',
          },
        },
      });
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });
      
      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Should be authenticated
      expect(result.current.isAuthenticated).toBe(true);
      
      // Call logout
      act(() => {
        result.current.logout();
      });
      
      // Should not be authenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      
      // Should have removed token from localStorage
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
    it('resetPassword function calls authService.resetPassword', async () => {
        // Mock successful resetPassword
        vi.mocked(authService.resetPassword).mockResolvedValue({
          data: {
            success: true,
            message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
          },
        });
        
        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });
        
        // Call resetPassword
        await act(async () => {
          await result.current.resetPassword('test@example.com');
        });
        
        // Should call authService.resetPassword with email
        expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
      });
    });
  });