import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  LockClosedIcon,
  BellIcon,
  LanguageIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Define validation schema for profile form
  const profileSchema = z.object({
    firstName: z.string().min(1, t('common.required')),
    lastName: z.string().min(1, t('common.required')),
    email: z.string().email(t('common.invalidEmail')),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  // Define validation schema for password form
  const passwordSchema = z.object({
    currentPassword: z.string().min(1, t('common.required')),
    newPassword: z.string().min(8, t('common.passwordMinLength')),
    confirmPassword: z.string().min(1, t('common.required')),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: t('auth.passwordMatch'),
    path: ['confirmPassword'],
  });

  type PasswordFormData = z.infer<typeof passwordSchema>;

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Define validation schema for company form
  const companySchema = z.object({
    companyName: z.string().min(1, t('common.required')),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
  });

  type CompanyFormData = z.infer<typeof companySchema>;

  const {
    register: registerCompany,
    handleSubmit: handleCompanySubmit,
    formState: { errors: companyErrors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: user?.companyName || '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // In a real application, this would be an API call
      // await axios.put('/api/auth/profile', data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profil mis à jour avec succès !');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // In a real application, this would be an API call
      // await axios.put('/api/auth/password', {
      //   currentPassword: data.currentPassword,
      //   newPassword: data.newPassword,
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Mot de passe mis à jour avec succès !');
      resetPasswordForm();
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCompanySubmit = async (data: CompanyFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // In a real application, this would be an API call
      // await axios.put('/api/company', data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Informations de l\'entreprise mises à jour avec succès !');
    } catch (err: any) {
      console.error('Error updating company:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setSuccess('Langue changée avec succès !');
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleRequestDataExport = () => {
    // In a real application, this would trigger a data export process
    setSuccess('Demande d\'exportation de données envoyée. Vous recevrez un email sous peu.');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('settings.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card padding="none">
            <nav className="flex flex-col">
              <button
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <UserIcon className="h-5 w-5 mr-3" />
                {t('settings.profile')}
              </button>
              <button
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  activeTab === 'company'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('company')}
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-3" />
                {t('settings.company')}
              </button>
              <button
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  activeTab === 'password'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('password')}
              >
                <LockClosedIcon className="h-5 w-5 mr-3" />
                Mot de passe
              </button>
              <button
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  activeTab === 'notifications'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <BellIcon className="h-5 w-5 mr-3" />
                {t('settings.notifications')}
              </button>
              <button
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  activeTab === 'language'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('language')}
              >
                <LanguageIcon className="h-5 w-5 mr-3" />
                {t('settings.language')}
              </button>
              <button
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  activeTab === 'privacy'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('privacy')}
              >
                <ShieldExclamationIcon className="h-5 w-5 mr-3" />
                {t('settings.privacy')}
              </button>
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {success && (
            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setSuccess(null)}
                      className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card title={t('settings.profile')} padding="normal">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('common.firstName')}
                    error={profileErrors.firstName?.message}
                    leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
                    {...registerProfile('firstName')}
                  />
                  
                  <Input
                    label={t('common.lastName')}
                    error={profileErrors.lastName?.message}
                    leftIcon={<UserIcon className="h-5 w-5 text-gray-400" />}
                    {...registerProfile('lastName')}
                  />
                </div>
                
                <Input
                  label={t('common.email')}
                  type="email"
                  error={profileErrors.email?.message}
                  leftIcon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                  {...registerProfile('email')}
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Company Settings */}
          {activeTab === 'company' && (
            <Card title={t('settings.company')} padding="normal">
              <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="space-y-4">
                <Input
                  label={t('common.companyName')}
                  error={companyErrors.companyName?.message}
                  leftIcon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />}
                  {...registerCompany('companyName')}
                />
                
                <Input
                  label="Adresse"
                  error={companyErrors.address?.message}
                  {...registerCompany('address')}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone"
                    error={companyErrors.phone?.message}
                    {...registerCompany('phone')}
                  />
                  
                  <Input
                    label="Site web"
                    error={companyErrors.website?.message}
                    {...registerCompany('website')}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Password Settings */}
          {activeTab === 'password' && (
            <Card title="Changer le mot de passe" padding="normal">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  error={passwordErrors.currentPassword?.message}
                  leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                  {...registerPassword('currentPassword')}
                />
                
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  error={passwordErrors.newPassword?.message}
                  helperText={t('common.passwordMinLength')}
                  leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                  {...registerPassword('newPassword')}
                />
                
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  error={passwordErrors.confirmPassword?.message}
                  leftIcon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                  {...registerPassword('confirmPassword')}
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card title={t('settings.notifications')} padding="normal">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Email notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="email_new_candidates"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          defaultChecked
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="email_new_candidates" className="font-medium text-gray-700">
                          Nouveaux candidats
                        </label>
                        <p className="text-gray-500">Recevoir des notifications quand de nouveaux candidats sont ajoutés.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="email_interviews"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          defaultChecked
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="email_interviews" className="font-medium text-gray-700">
                          Rappels d'entretiens
                        </label>
                        <p className="text-gray-500">Recevoir des rappels pour les entretiens à venir.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="email_digests"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="email_digests" className="font-medium text-gray-700">
                          Résumés hebdomadaires
                        </label>
                        <p className="text-gray-500">Recevoir un résumé hebdomadaire de l'activité.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications dans l'application</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="app_notifications"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          defaultChecked
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="app_notifications" className="font-medium text-gray-700">
                          Activer les notifications
                        </label>
                        <p className="text-gray-500">Afficher les notifications dans l'application.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setSuccess('Paramètres de notification mis à jour !')}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Language Settings */}
          {activeTab === 'language' && (
            <Card title={t('settings.language')} padding="normal">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Sélectionnez la langue que vous souhaitez utiliser dans l'application.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`p-3 rounded-md border flex items-center ${
                      i18n.language === 'fr' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => changeLanguage('fr')}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-3">
                      <span className="text-xl">🇫🇷</span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">Français</span>
                      <span className="text-xs text-gray-500">French</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    className={`p-3 rounded-md border flex items-center ${
                      i18n.language === 'en' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => changeLanguage('en')}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-3">
                      <span className="text-xl">🇬🇧</span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">English</span>
                      <span className="text-xs text-gray-500">Anglais</span>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <Card title={t('settings.privacy')} padding="normal">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Exportation de données</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Vous pouvez demander une exportation complète de vos données personnelles conformément au RGPD.
                  </p>
                  <Button
                    variant="outline"
                    leftIcon={<DocumentArrowDownIcon className="h-5 w-5" />}
                    onClick={handleRequestDataExport}
                  >
                    {t('settings.dataExport')}
                  </Button>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Suppression du compte</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    La suppression de votre compte est irréversible et entraînera la perte définitive de toutes vos données.
                  </p>
                  <Button
                    variant="outline"
                    leftIcon={<ExclamationTriangleIcon className="h-5 w-5 text-red-500" />}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    {t('settings.delete')}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Supprimer votre compte ?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Cette action est irréversible. Toutes vos données personnelles, offres d'emploi, et informations sur les candidats seront définitivement supprimées.
                    </p>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">
                        Pour confirmer, veuillez taper "SUPPRIMER" ci-dessous :
                      </p>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteConfirmation !== 'SUPPRIMER'}
                  onClick={() => {
                    // In a real app, this would call an API to delete the account
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation('');
                    alert('Dans une application réelle, votre compte serait supprimé.');
                  }}
                >
                  Supprimer définitivement
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation('');
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;