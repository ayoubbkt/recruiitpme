import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  // Define validation schema
  const loginSchema = z.object({
    email: z.string().email(t('common.invalidEmail')),
    password: z.string().min(1, t('common.required')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError(null);
      await login(data.email, data.password);
      navigate('/app');
    } catch (error: any) {
      console.error('Login error:', error);
      setApiError(
        error.response?.data?.message || 'Une erreur est survenue lors de la connexion'
      );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        {t('auth.loginTitle')}
      </h2>

      {apiError && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          autoComplete="current-password"
          leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
        >
          {t('common.login')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
      </div>
    );
};

export default Login;