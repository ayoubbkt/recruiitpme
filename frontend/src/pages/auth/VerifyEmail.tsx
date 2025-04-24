import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Token de vérification manquant');
        setVerifying(false);
        return;
      }
      
      try {
        await authService.verifyEmail(token);
        setSuccess(true);
        setVerifying(false);
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        console.error('Email verification error:', err);
        setError(err.response?.data?.message || 'Une erreur est survenue lors de la vérification');
        setVerifying(false);
      }
    };
    
    verifyEmail();
  }, [token, navigate]);

  if (verifying) {
    return (
      <div className="text-center">
        <div className="animate-spin h-12 w-12 mx-auto border-b-2 border-primary-600 rounded-full"></div>
        <p className="mt-4 text-gray-600">Vérification de votre email...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Email vérifié avec succès !</h2>
        <p className="mt-2 text-gray-600">
          Votre compte a été activé. Vous pouvez maintenant vous connecter.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Aller à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircleIcon className="h-12 w-12 mx-auto text-red-500" />
      <h2 className="mt-4 text-lg font-medium text-gray-900">Échec de la vérification</h2>
      <p className="mt-2 text-gray-600">
        {error || 'Le lien de vérification est invalide ou a expiré.'}
      </p>
      <div className="mt-6">
        <Link
          to="/login"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;