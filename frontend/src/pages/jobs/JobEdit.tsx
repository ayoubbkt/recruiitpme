import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
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
import { Job } from '../../types';

const JobEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [pipelineStages, setPipelineStages] = useState<string[]>([]);
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
    status: z.string().min(1, t('common.required')),
  });

  type JobFormData = z.infer<typeof jobFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
  });

  // Fetch job data
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real application, this would be an API call
        // const response = await axios.get(`/api/jobs/${id}`);
        // const jobData = response.data;
        
        // Mock data for demonstration
        const mockJob: Job = {
          id: id || '1',
          title: 'Développeur Full Stack',
          location: 'Paris, France',
          contractType: 'cdi',
          status: 'active',
          salary: '45 000€ - 55 000€ / an',
          experienceLevel: 'intermediate',
          languages: 'Français, Anglais',
          startDate: '2025-06-01',
          description: `## Description du poste

Nous recherchons un développeur Full Stack passionné pour rejoindre notre équipe à Paris. Vous travaillerez sur le développement de nouvelles fonctionnalités et l'amélioration de notre plateforme existante.

## Responsabilités

- Développer des fonctionnalités front-end et back-end
- Collaborer avec les designers et les product managers
- Participer aux revues de code et au debugging
- Contribuer à l'architecture technique

## Profil recherché

- 3+ ans d'expérience en développement web
- Maîtrise de JavaScript/TypeScript, React, Node.js
- Expérience avec les bases de données SQL et NoSQL
- Connaissances en DevOps (CI/CD, Docker) est un plus`,
          skills: [
            'JavaScript',
            'TypeScript',
            'React',
            'Node.js',
            'SQL',
            'Git',
            'Docker',
          ],
          pipelineStages: [
            'À contacter',
            'Entretien RH',
            'Test technique',
            'Entretien final',
            'Proposition',
            'Embauché',
          ],
          createdAt: '2025-03-15',
          updatedAt: '2025-04-10',
          candidates: {
            total: 12,
            byStatus: {
              new: 3,
              toContact: 4,
              interview: 2,
              rejected: 2,
              hired: 1,
            },
          },
        };
        
        // Simulate API delay
        setTimeout(() => {
          setJob(mockJob);
          setSkills(mockJob.skills);
          setPipelineStages(mockJob.pipelineStages);
          
          // Reset form with job data
          reset({
            title: mockJob.title,
            location: mockJob.location,
            contractType: mockJob.contractType,
            salary: mockJob.salary || '',
            experienceLevel: mockJob.experienceLevel,
            startDate: mockJob.startDate || '',
            languages: mockJob.languages || '',
            description: mockJob.description,
            status: mockJob.status,
          });
          
          setLoading(false);
        }, 800);
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Une erreur est survenue');
        setLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
    } else {
      setError('ID de l\'offre non spécifié');
      setLoading(false);
    }
  }, [id, reset]);

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

  const onSubmit = async (data: JobFormData) => {
    if (skills.length === 0) {
      alert('Veuillez ajouter au moins une compétence requise.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare the full data to send to API
      const jobData = {
        ...data,
        skills,
        pipelineStages,
      };
      
      console.log('Updating job with data:', jobData);
      
      // In a real application, this would be an API call
      // await axios.put(`/api/jobs/${id}`, jobData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to job details page
      navigate(`/app/jobs/${id}`);
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Une erreur est survenue lors de la mise à jour de l\'offre.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => navigate('/app/jobs')}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Retour aux offres
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(`/app/jobs/${id}`)}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('jobs.editTitle')}
        </h1>
      </div>

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

          {/* Pipeline Stages and Status */}
          <div className="md:col-span-1 space-y-6">
            {/* Status */}
            <Card title="Statut de l'offre" padding="normal">
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    id="status"
                    className={`block w-full rounded-md sm:text-sm py-2 px-3 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.status ? 'border-red-300' : ''
                    }`}
                    {...register('status')}
                  >
                    <option value="active">{t('jobs.status.active')}</option>
                    <option value="draft">{t('jobs.status.draft')}</option>
                    <option value="closed">{t('jobs.status.closed')}</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Pipeline Stages */}
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

            <Card title="Mise à jour" padding="normal">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Après mise à jour, les changements seront immédiatement appliqués à l'offre.
                </p>
                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={submitting}
                  >
                    Mettre à jour l'offre
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => navigate(`/app/jobs/${id}`)}
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

export default JobEdit;