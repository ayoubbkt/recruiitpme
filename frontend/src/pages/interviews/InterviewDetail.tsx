import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  VideoCameraIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/helpers';

// Types
interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  date: string;
  time: string;
  interviewer: string;
  interviewerEmail?: string;
  videoLink?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'noShow';
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

const InterviewDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // In a real application, fetch data from the backend
    const fetchInterviewDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Mock data for demonstration
        const mockInterview: Interview = {
          id: id || '1',
          candidateId: '1',
          candidateName: 'Sophie Martin',
          candidateEmail: 'sophie.martin@example.com',
          jobId: '1',
          jobTitle: 'Développeur Full Stack',
          date: '2025-04-25',
          time: '10:00',
          interviewer: 'Marie Dupont',
          interviewerEmail: 'marie.dupont@entreprise.com',
          videoLink: 'https://meet.google.com/abc-defg-hij',
          notes: 'Préparer des questions techniques sur React et Node.js. Vérifier les projets sur GitHub.',
          status: 'scheduled',
          createdAt: '2025-04-15',
          updatedAt: '2025-04-15',
        };
        
        // Simulate API delay
        setTimeout(() => {
          setInterview(mockInterview);
          setIsLoading(false);
        }, 800);
      } catch (err: any) {
        console.error('Error fetching interview details:', err);
        setError(err.message || 'Une erreur est survenue');
        setIsLoading(false);
      }
    };

    fetchInterviewDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: 'scheduled' | 'completed' | 'canceled' | 'noShow') => {
    try {
      setSubmitting(true);
      
      // In a real application, this would be an API call
      // await axios.put(`/api/interviews/${id}/status`, { status: newStatus });
      
      // Update local state
      if (interview) {
        setInterview({
          ...interview,
          status: newStatus,
        });
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSubmitting(false);
    } catch (error) {
      console.error('Error updating interview status:', error);
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    
    try {
      setSubmitting(true);
      
      // In a real application, this would be an API call
      // await axios.post(`/api/interviews/${id}/feedback`, { feedback });
      
      // Update local state
      if (interview) {
        setInterview({
          ...interview,
          feedback,
          status: 'completed',
        });
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitting(false);
    }
  };

  const handleDeleteInterview = async () => {
    try {
      setSubmitting(true);
      
      // In a real application, this would be an API call
      // await axios.delete(`/api/interviews/${id}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Redirect to interviews list
      navigate('/app/interviews');
    } catch (error) {
      console.error('Error deleting interview:', error);
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadge = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="primary" size="md" rounded>Planifié</Badge>;
      case 'completed':
        return <Badge variant="success" size="md" rounded>Terminé</Badge>;
      case 'canceled':
        return <Badge variant="danger" size="md" rounded>Annulé</Badge>;
      case 'noShow':
        return <Badge variant="warning" size="md" rounded>No-show</Badge>;
      default:
        return null;
    }
  };
  
  const isInterviewInFuture = () => {
    if (!interview) return false;
    
    const interviewDateTime = new Date(`${interview.date}T${interview.time}`);
    return interviewDateTime > new Date();
  };
  
  const canUpdateStatus = () => {
    if (!interview) return false;
    
    // Can change status if not already completed or canceled
    return ['scheduled'].includes(interview.status);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error || 'Entretien non trouvé'}</p>
        <button
          onClick={() => navigate('/app/interviews')}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Retour aux entretiens
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with interview info and actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <button
            onClick={() => navigate('/app/interviews')}
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 mr-3">
                Entretien avec {interview.candidateName}
              </h1>
              {getStatusBadge(interview.status)}
            </div>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <BriefcaseIcon className="h-4 w-4 mr-1" />
              <Link
                to={`/app/jobs/${interview.jobId}`}
                className="text-primary-600 hover:text-primary-900"
              >
                {interview.jobTitle}
              </Link>
              <span className="mx-2">•</span>
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{new Date(interview.date).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{interview.time}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {isInterviewInFuture() && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<PencilIcon className="h-5 w-5" />}
              onClick={() => navigate(`/app/interviews/${interview.id}/edit`)}
            >
              Modifier
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<TrashIcon className="h-5 w-5 text-red-500" />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Supprimer
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Main details */}
        <div className="md:col-span-2 space-y-6">
          {/* Interview details */}
          <Card padding="normal">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500">Date et heure</h3>
                  <div className="flex items-center text-gray-900">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium">
                      {new Date(interview.date).toLocaleDateString()}
                    </span>
                    <span className="mx-2">•</span>
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium">{interview.time}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500">Interviewer</h3>
                  <div className="flex items-center text-gray-900">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium">{interview.interviewer}</span>
                  </div>
                  {interview.interviewerEmail && (
                    <div className="text-sm text-gray-600 ml-7">
                      <a 
                        href={`mailto:${interview.interviewerEmail}`} 
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {interview.interviewerEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {interview.videoLink && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Lien visioconférence</h3>
                  <div className="flex items-center">
                    <VideoCameraIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a
                      href={interview.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      {interview.videoLink}
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              )}
              
              {interview.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notes internes</h3>
                  <div className="bg-gray-50 p-3 rounded-md text-gray-700 text-sm">
                    {interview.notes}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Candidate info */}
          <Card title="Informations du candidat" padding="normal">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-lg font-medium">
                  {interview.candidateName.split(' ').map(name => name[0]).join('')}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {interview.candidateName}
                    </h3>
                    <p className="text-sm text-gray-600">{interview.jobTitle}</p>
                  </div>
                  <Link to={`/app/candidates/${interview.candidateId}`}>
                    <Button variant="outline" size="sm">
                      Voir le profil
                    </Button>
                  </Link>
                </div>
                <div className="mt-2 flex">
                  <a
                    href={`mailto:${interview.candidateEmail}`}
                    className="text-sm text-primary-600 hover:text-primary-900 flex items-center"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                    {interview.candidateEmail}
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Feedback section */}
          {interview.status === 'completed' ? (
            <Card title="Compte-rendu de l'entretien" padding="normal">
              <div className="space-y-3">
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Entretien terminé</span>
                </div>
                
                {interview.feedback ? (
                  <div className="bg-gray-50 p-4 rounded-md text-gray-700">
                    {interview.feedback}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Aucun compte-rendu n'a été ajouté.</p>
                )}
              </div>
            </Card>
          ) : interview.status === 'canceled' ? (
            <Card title="Entretien annulé" padding="normal">
              <div className="flex items-center text-red-600">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Cet entretien a été annulé</span>
              </div>
            </Card>
          ) : interview.status === 'noShow' ? (
            <Card title="Candidat absent" padding="normal">
              <div className="flex items-center text-amber-600">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Le candidat ne s'est pas présenté à l'entretien</span>
              </div>
            </Card>
          ) : (
            <Card title="Ajouter un compte-rendu" padding="normal">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Après l'entretien, ajoutez ici vos impressions, notes et décision concernant ce candidat.
                </p>
                <textarea
                  rows={5}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Évaluez les compétences, l'attitude et la pertinence du candidat..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSubmitFeedback}
                    isLoading={submitting}
                    disabled={!feedback.trim()}
                  >
                    Enregistrer et marquer comme terminé
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column - Actions */}
        <div className="md:col-span-1 space-y-6">
          {/* Status actions */}
          {canUpdateStatus() && (
            <Card title="Statut de l'entretien" padding="normal">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Mettez à jour le statut de cet entretien en fonction de son déroulement.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="success"
                    fullWidth
                    leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                    onClick={() => setFeedback(feedback || 'Entretien complété avec succès.')}
                    disabled={interview.status !== 'scheduled'}
                    isLoading={submitting && interview.status === 'completed'}
                  >
                    Marquer comme terminé
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    leftIcon={<XCircleIcon className="h-5 w-5" />}
                    onClick={() => handleStatusChange('canceled')}
                    disabled={interview.status !== 'scheduled'}
                    isLoading={submitting && interview.status === 'canceled'}
                  >
                    Annuler l'entretien
                  </Button>
                  <Button
                    variant="warning"
                    fullWidth
                    leftIcon={<XCircleIcon className="h-5 w-5" />}
                    onClick={() => handleStatusChange('noShow')}
                    disabled={interview.status !== 'scheduled'}
                    isLoading={submitting && interview.status === 'noShow'}
                  >
                    Candidat absent
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Quick actions */}
          <Card title="Actions rapides" padding="normal">
            <div className="space-y-3">
              <a
                href={`mailto:${interview.candidateEmail}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
                >
                  Envoyer un email
                </Button>
              </a>
              
              {interview.videoLink && (
                <a
                  href={interview.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<VideoCameraIcon className="h-5 w-5" />}
                  >
                    Rejoindre la visio
                  </Button>
                </a>
              )}
              
              <Link to={`/app/candidates/${interview.candidateId}`}>
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<UserCircleIcon className="h-5 w-5" />}
                >
                  Profil candidat
                </Button>
              </Link>
              
              <Link to={`/app/jobs/${interview.jobId}`}>
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<BriefcaseIcon className="h-5 w-5" />}
                >
                  Voir l'offre
                </Button>
              </Link>
            </div>
          </Card>

          {/* Interview details */}
          <Card title="Détails" padding="normal">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Statut</span>
                <span>{getStatusBadge(interview.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le</span>
                <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière mise à jour</span>
                <span>{new Date(interview.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
                  <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Supprimer cet entretien ?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer cet entretien ? Cette action est irréversible.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleDeleteInterview}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
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

export default InterviewDetail;