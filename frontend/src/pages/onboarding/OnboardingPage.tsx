import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BriefcaseIcon,
  DocumentArrowUpIcon,
  SparklesIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const OnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('onboarding.step1'),
      description: 'Créez votre première offre d\'emploi et détaillez les compétences recherchées.',
      icon: <BriefcaseIcon className="h-12 w-12 text-primary-600" />,
      action: () => navigate('/app/jobs/create'),
    },
    {
      title: t('onboarding.step2'),
      description: 'Importez les CV des candidats par lot pour les associer à une offre.',
      icon: <DocumentArrowUpIcon className="h-12 w-12 text-primary-600" />,
      action: () => navigate('/app/candidates/import'),
    },
    {
      title: t('onboarding.step3'),
      description: 'Notre IA analyse automatiquement les profils et les classe selon leur pertinence.',
      icon: <SparklesIcon className="h-12 w-12 text-primary-600" />,
      action: () => navigate('/app/candidates'),
    },
    {
      title: t('onboarding.step4'),
      description: 'Planifiez et gérez vos entretiens avec les meilleurs candidats.',
      icon: <CalendarIcon className="h-12 w-12 text-primary-600" />,
      action: () => navigate('/app/interviews/create'),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigate('/app');
    }
  };

  const handleSkip = () => {
    navigate('/app');
  };

  const handleActionClick = () => {
    steps[currentStep].action();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('onboarding.welcome')}
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Suivez ces quelques étapes pour commencer à utiliser RecrutPME et optimiser votre processus de recrutement.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-16 rounded-full ${
                index <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 p-4 bg-primary-50 rounded-full">
            {steps[currentStep].icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg">
            {steps[currentStep].description}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleActionClick}
          >
            {steps[currentStep].title}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleSkip}
        >
          {t('onboarding.skip')}
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
        >
          {currentStep < steps.length - 1 ? t('onboarding.next') : t('onboarding.complete')}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPage;