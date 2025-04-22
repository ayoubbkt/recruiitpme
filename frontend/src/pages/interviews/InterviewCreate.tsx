import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  VideoCameraIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { candidatesService, jobsService, interviewsService } from '../../services/api';
import { Candidate, InterviewFormData } from '../../types';

const InterviewCreate: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Form validation schema
  const interviewSchema = z.object({
    candidateId: z.string().min(1, 'Veuillez sélectionner un candidat'),
    date: z.string().min(1, 'La date est requise'),
    time: z.string().min(1, 'L\'heure est requise'),
    interviewer: z.string().min(1, 'L\'interviewer est requis'),
    videoLink: z.string().optional(),
    notes: z.string().optional(),
    sendEmail: z.boolean().optional(),
  });

  type FormData = z.infer<typeof interviewSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      sendEmail: true,
    }
  });

  // Charger les candidats disponibles
  const fetchCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel API réel - charger tous les candidats qui ne sont pas refusés
      const response = await candidatesService.getCandidates({ 
        status: ['new', 'toContact', 'interview'],
        limit: 100
      });
      
      setCandidates(response.data);
      
      // Si candidateId est présent dans l'URL, sélectionner le candidat
      if (candidateId) {
        const candidate = response.data.find((c: Candidate) => c.id === candidateId);
        if (candidate) {
          setSelectedCandidate(candidate);
          setValue('candidateId', candidateId);
        } else {
          setError('Candidat non trouvé');
        }
      }
    } catch (err: any) {
      console.error('Error fetching candidates:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors du chargement des candidats');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, setValue]);

  useEffect(() => {
    const abortController = new AbortController();
    
    fetchCandidates();
    
    return () => {
      abortController.abort();
    };
  }, [fetchCandidates]);

  // Handle candidate selection change
  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const candidateId = e.target.value;
    const candidate = candidates.find(c => c.id === candidateId);
    setSelectedCandidate(candidate || null);
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      if (!selectedCandidate) {
        setError('Veuillez sélectionner un candidat');
        setSubmitting(false);
        return;
      }
      
      // Préparer les données pour l'API
      const interviewData: InterviewFormData = {
        candidateId: data.candidateId,
        date: data.date,
        time: data.time,
        interviewer: data.interviewer,
        videoLink: data.videoLink,
        notes: data.notes,
        sendEmail: data.sendEmail,
      };
      
      // Appel API réel
      await interviewsService.createInterview(interviewData);
      
      // Mettre à jour le statut du candidat à "interview" s'il n'est pas déjà à ce statut
      if (selectedCandidate.status !== 'interview') {
        await candidatesService.updateCandidateStatus(selectedCandidate.id, 'interview');
      }
      
      // Redirection vers la liste des entretiens
      navigate('/app/interviews');
    } catch (err: any) {
      console.error('Error creating interview:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création de l\'entretien');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate today's date in ISO format (YYYY-MM-DD) for min date restriction
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('interviews.schedule')}
        </h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">
            {t('common.loading')}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Candidate Selection */}
              <Card title="Sélection du candidat" padding="normal">
                <div className="space-y-4">
                  <div className="relative">
                    <label htmlFor="candidateId" className="block text-sm font-medium text-gray-700 mb-1">
                      Candidat
                    </label>
                    <div className="relative">
                      <select
                        id="candidateId"
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors.candidateId ? 'border-red-300' : ''
                        }`}
                        {...register('candidateId')}
                        onChange={handleCandidateChange}
                        disabled={!!candidateId} // Disable if candidateId is provided in URL
                      >
                        <option value="">Sélectionner un candidat</option>
                        {candidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name} - {candidate.jobTitle}
                          </option>
                        ))}
                      </select>
                      {errors.candidateId && (
                        <p className="mt-1 text-sm text-red-600">{errors.candidateId.message}</p>
                      )}
                    </div>
                  </div>

                  {selectedCandidate && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-medium">
                          {selectedCandidate.name.split(' ').map(name => name[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">{selectedCandidate.name}</h3>
                          <p className="text-xs text-gray-500">{selectedCandidate.jobTitle}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Interview Details */}
              <Card title="Détails de l'entretien" padding="normal">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('interviews.date')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="date"
                          min={today}
                          className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                            errors.date ? 'border-red-300' : ''
                          }`}
                          {...register('date')}
                        />
                        {errors.date && (
                          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('interviews.time')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="time"
                          id="time"
                          className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                            errors.time ? 'border-red-300' : ''
                          }`}
                          {...register('time')}
                        />
                        {errors.time && (
                          <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="interviewer" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('interviews.interviewer')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="interviewer"
                        placeholder="Nom de l'interviewer"
                        className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors.interviewer ? 'border-red-300' : ''
                        }`}
                        {...register('interviewer')}
                      />
                      {errors.interviewer && (
                        <p className="mt-1 text-sm text-red-600">{errors.interviewer.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('interviews.videoLink')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <VideoCameraIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="videoLink"
                        placeholder="https://meet.google.com/..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        {...register('videoLink')}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Optionnel. Lien vers Google Meet, Zoom, Microsoft Teams, etc.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('interviews.notes')}
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      placeholder="Notes internes sur l'entretien"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      {...register('notes')}
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Notes internes qui ne seront pas envoyées au candidat.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="md:col-span-1 space-y-6">
              {/* Email Notification */}
              <Card title="Notification" padding="normal">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="sendEmail"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        {...register('sendEmail')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="sendEmail" className="font-medium text-gray-700">
                        {t('interviews.sendEmail')}
                      </label>
                      <p className="text-gray-500">
                        Envoyer un email de confirmation au candidat avec les détails de l'entretien.
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  {selectedCandidate && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Aperçu de l'email</h3>
                      <div className="text-xs text-gray-700 space-y-1">
                        <p><strong>À:</strong> {selectedCandidate.email}</p>
                        <p><strong>Objet:</strong> Invitation à un entretien pour le poste de {selectedCandidate.jobTitle}</p>
                        <div className="pt-2 border-t border-gray-200 mt-2">
                          <p>Bonjour {selectedCandidate.name.split(' ')[0]},</p>
                          <p className="mt-1">Nous sommes heureux de vous inviter à un entretien pour le poste de {selectedCandidate.jobTitle}.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Submit */}
              <Card padding="normal">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={submitting}
                    leftIcon={<CalendarIcon className="h-5 w-5" />}
                  >
                    Programmer l'entretien
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => navigate(-1)}
                  >
                    Annuler
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default InterviewCreate;