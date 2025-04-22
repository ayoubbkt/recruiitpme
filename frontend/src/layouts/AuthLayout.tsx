import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AuthLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center text-3xl font-bold text-white">
            <span>Recrut</span>
            <span className="text-secondary-400">PME</span>
          </Link>
        </div>
        
        {/* Language Switcher */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => changeLanguage('fr')}
            className={`px-3 py-1 rounded-md text-sm ${
              i18n.language === 'fr'
                ? 'bg-white text-primary-700 font-semibold'
                : 'text-white bg-primary-700/30 hover:bg-primary-700/50'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1 rounded-md text-sm ${
              i18n.language === 'en'
                ? 'bg-white text-primary-700 font-semibold'
                : 'text-white bg-primary-700/30 hover:bg-primary-700/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;