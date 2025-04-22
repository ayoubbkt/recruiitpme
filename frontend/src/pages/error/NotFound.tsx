import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="text-9xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page non trouvée</h1>
        <p className="text-lg text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Link to="/app">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<HomeIcon className="h-5 w-5" />}
            >
              Retour à l'accueil
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            Retour en arrière
          </Button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
        <div className="w-96 h-96 rounded-full bg-primary-600"></div>
      </div>
      <div className="absolute top-1/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
        <div className="w-48 h-48 rounded-full bg-secondary-500"></div>
      </div>
      <div className="absolute bottom-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
        <div className="w-64 h-64 rounded-full bg-secondary-500"></div>
      </div>
    </div>
  );
};

export default NotFound;