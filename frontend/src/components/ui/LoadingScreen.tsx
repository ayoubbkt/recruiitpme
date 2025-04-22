import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="text-3xl font-bold">
            <span className="text-primary-700">Recrut</span>
            <span className="text-secondary-500">PME</span>
          </div>
        </div>
        
        <svg
          className="animate-spin h-12 w-12 mx-auto text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        
        <p className="mt-4 text-sm text-gray-600">Chargement...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;