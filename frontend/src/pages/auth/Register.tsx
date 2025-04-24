import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Define validation schema
  const registerSchema = z.object({
    firstName: z.string().min(1, t('common.required')),
    lastName: z.string().min(1, t('common.required')),
    email: z.string().email(t('common.invalidEmail')),
    password: z.string().min(8, t('common.passwordMinLength')),
    companyName: z.string().min(1, t('common.required')),
    terms: z.literal(true, {
      errorMap: () => ({ message: t('common.required') }),
    }),
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      
      setApiError(null);
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Registration error:',  error.response?.data);
      setApiError(
        error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription'
      );
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <h2 className="mt-3 text-lg font-medium text-gray-900">
          Inscription réussie !
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Un email de confirmation a été envoyé à votre adresse email. Veuillez cliquer sur le lien
          pour confirmer votre compte.
        </p>
        <div className="mt-5">
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Retour à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        {t('auth.registerTitle')}
      </h2>

      {apiError && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('common.firstName')}
            autoComplete="given-name"
            leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />

          <Input
            label={t('common.lastName')}
            autoComplete="family-name"
            leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label={t('common.email')}
          type="email"
          autoComplete="email"
          leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={t('common.password')}
          type="password"
          autoComplete="new-password"
          leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          error={errors.password?.message}
          helperText={t('common.passwordMinLength')}
          {...register('password')}
        />

        <Input
          label={t('common.companyName')}
          leftIcon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />}
          error={errors.companyName?.message}
          {...register('companyName')}
        />

        <div>
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              {...register('terms')}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
              {t('auth.termsAgree')}
            </label>
          </div>
          {errors.terms?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
        >
          {t('common.register')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            {t('common.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;