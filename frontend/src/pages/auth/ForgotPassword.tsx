import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Define validation schema
  const resetPasswordSchema = z
    .object({
      password: z.string().min(8, t('common.passwordMinLength')),
      confirmPassword: z.string().min(8, t('common.passwordMinLength')),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('auth.passwordMatch'),
      path: ['confirmPassword'],
    });

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setApiError('Token de réinitialisation manquant');
      return;
    }
    
    try {
      setApiError(null);
      await axios.post('/api/auth/reset-password/confirm', {
        password: data.password,
        token,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password confirmation error:', error);
      setApiError(
        error.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation'
      );
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Lien de réinitialisation invalide. Veuillez demander un nouveau lien.
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          Mot de passe réinitialisé !
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
        </p>
        <div className="mt-5">
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Aller à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        {t('auth.resetPassword')}
      </h2>

      {apiError && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
        >
          {t('auth.resetPassword')}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;