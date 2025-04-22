import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  TagIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { jobsService } from '../../services/api';
import { JobFormData } from '../../types';

const JobCreate: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [pipelineStages, setPipelineStages] = useState([
    'À contacter',
    'Entretien RH',
    'Test technique',
    'Entretien final',
    'Proposition',
    'Embauché',
  ]);
  const [newStage, setNewStage] = useState('');

  // Define validation schema
  const jobFormSchema = z.object({
    title: z.string().min(1, t('common.required')),
    location: z.string().min(1, t('common.required')),
    contractType: z.string().min(1, t('common.required')),
    salary: z.string().optional(),
    experienceLevel: z.string().min(1, t('common.required')),
    startDate: z.string().optional(),
    languages: z.string().optional(),
    description: z.string().min(1, t('common.required')),
    status: z.string().optional(),
  });

  type FormData = z.infer<typeof jobFormSchema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      contractType: 'cdi',
      experienceLevel: 'intermediate',
      status: 'active',
    },
  });

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddPipelineStage = () => {
    if (newStage.trim() && !pipelineStages.includes(newStage.trim())) {
      setPipelineStages([...pipelineStages, newStage.trim()]);
      setNewStage('');
    }
  };

  const handleRemovePipelineStage = (stage: string) => {
    setPipelineStages(pipelineStages.filter((s) => s !== stage));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const onSubmit = async (data: FormData) => {
    if (skills.length === 0) {
      setError('Veuillez ajouter au moins une compétence requise.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare the full data to send to API
      const jobData: JobFormData = {
        ...data,
        skills,
        pipelineStages,
      };
      
      // Appel API réel pour créer l'offre
      await jobsService.createJob(jobData);
      
      // Redirection vers la liste des offres après création réussie
      navigate('/app/jobs');
    } catch (err: any) {
      console.error('Error creating job:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création de l\'offre.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/app/jobs')}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('jobs.createTitle')}
        </h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main job details */}
          <div className="md:col-span-2 space-y-6">
            <Card title="Informations générales" padding="normal">
              <div className="space-y-4">
                <Input
                  label={t('jobs.jobTitle')}
                  error={errors.title?.message}
                  {...register('title')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('jobs.location')}
                    error={errors.location?.message}
                    placeholder="Paris, France ou Télétravail"
                    {...register('location')}
                  />

                  <div>
                    <label htmlFor="contractType" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('jobs.contract')}
                    </label>
                    <select
                      id="contractType"
                      className={`block w-full rounded-md sm:text-sm py-2 px-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.contractType ? 'border-red-300' : ''
                      }`}
                      {...register('contractType')}
                    >
                      <option value="cdi">{t('jobs.contracts.cdi')}</option>
                      <option value="cdd">{t('jobs.contracts.cdd')}</option>
                      <option value="internship">{t('jobs.contracts.internship')}</option>
                      <option value="freelance">{t('jobs.contracts.freelance')}</option>
                      <option value="apprenticeship">{t('jobs.contracts.apprenticeship')}</option>
                    </select>
                    {errors.contractType && (
                      <p className="mt-1 text-sm text-red-600">{errors.contractType.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('jobs.salary')}
                    placeholder="Optionnel, ex: 45-55k€ annuel"
                    {...register('salary')}
                  />

                  <div>
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('jobs.experience')}
                    </label>
                    <select
                      id="experienceLevel"
                      className={`block w-full rounded-md sm:text-sm py-2 px-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.experienceLevel ? 'border-red-300' : ''
                      }`}
                      {...register('experienceLevel')}
                    >
                      <option value="junior">{t('jobs.experience_levels.junior')}</option>
                      <option value="intermediate">{t('jobs.experience_levels.intermediate')}</option>
                      <option value="senior">{t('jobs.experience_levels.senior')}</option>
                    </select>
                    {errors.experienceLevel && (
                      <p className="mt-1 text-sm text-red-600">{errors.experienceLevel.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('jobs.startDate')}
                    type="date"
                    {...register('startDate')}
                  />

                  <Input
                    label={t('jobs.languages')}
                    placeholder="Ex: Français, Anglais"
                    {...register('languages')}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('jobs.description')}
                  </label>
                  <textarea
                    id="description"
                    rows={8}
                    className={`block w-full rounded-md sm:text-sm py-2 px-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.description ? 'border-red-300' : ''
                    }`}
                    {...register('description')}
                  ></textarea>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    id="status"
                    className="block w-full rounded-md sm:text-sm py-2 px-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    {...register('status')}
                  >
                    <option value="active">{t('jobs.status.active')}</option>
                    <option value="draft">{t('jobs.status.draft')}</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Required Skills */}
            <Card title="Compétences requises" padding="normal">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TagIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ajouter une compétence"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleAddSkill)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSkill}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1.5 text-primary-600 hover:text-primary-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      Ajoutez les compétences requises pour ce poste
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Pipeline Stages */}
          <div className="md:col-span-1 space-y-6">
            <Card title={t('jobs.pipeline')} padding="normal">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Personnalisez les étapes du processus de recrutement pour cette offre.
                </p>

                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Nouvelle étape"
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddPipelineStage)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPipelineStage}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-2 mt-3">
                  {pipelineStages.map((stage, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-800 text-xs font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{stage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePipelineStage(stage)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Publication" padding="normal">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Une fois enregistrée, l'offre sera visible sur votre tableau de bord et vous pourrez commencer à importer des CV.
                </p>
                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={submitting}
                  >
                    Publier l'offre
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => navigate('/app/jobs')}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobCreate;