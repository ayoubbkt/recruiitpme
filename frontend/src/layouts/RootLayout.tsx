import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';

const RootLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      // Public routes that don't require authentication
      const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      
      // Check if current path is a public route
      const isPublicRoute = publicRoutes.some(route => 
        location.pathname === route || location.pathname.startsWith('/reset-password')
      );

      if (isAuthenticated && isPublicRoute) {
        // If user is authenticated and tries to access a public route, redirect to dashboard
        navigate('/app', { replace: true });
      } else if (!isAuthenticated && !isPublicRoute) {
        // If user is not authenticated and tries to access a protected route, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Outlet />;
};

export default RootLayout;