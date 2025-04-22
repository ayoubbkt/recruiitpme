import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyEuroIcon,
  AcademicCapIcon,
  LanguageIcon,
  ClockIcon,
  TagIcon,
  FunnelIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

// Types
interface Job {
  id: string;
  title: string;
  location: string;
  contractType: string;
  status: string;
  salary: string;
  experienceLevel: string;
  languages: string;
  startDate: string;
  description: string;
  skills: string[];
  pipelineStages: string[];
  createdAt: string;
  updatedAt: string;
  candidates: {
    total: number;
    byStatus: {
      [key: string]: number;
    };
  };
}

const JobDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    // In a real application, fetch data from the backend
    const fetchJobDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
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
          setIsLoading(false);
        }, 800);
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Une erreur est survenue');
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      // In a real application, this would be an API call
      // await axios.delete(`/api/jobs/${id}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate('/app/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Une erreur est survenue lors de la suppression de l\'offre.');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR').format(date);
  };

  const getContractLabel = (contractType: string) => {
    return t(`jobs.contracts.${contractType}`);
  };

  const getExperienceLabel = (level: string) => {
    return t(`jobs.experience_levels.${level}`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'closed':
        return 'danger';
      default:
        return 'default';
    }
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

  if (error || !job) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error || 'Offre non trouvée'}</p>
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
      {/* Header with actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <button
            onClick={() => navigate('/app/jobs')}
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 mr-3">
                {job.title}
              </h1>
              <Badge
                variant={getStatusBadgeVariant(job.status)}
                size="sm"
                rounded
              >
                {t(`jobs.status.${job.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Créée le {formatDate(job.createdAt)} • Mise à jour le {formatDate(job.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link to={`/app/candidates/import?jobId=${job.id}`}>
            <Button
              variant="primary"
              leftIcon={<DocumentArrowUpIcon className="h-5 w-5" />}
            >
              {t('candidates.import')}
            </Button>
          </Link>
          <div className="flex space-x-2">
            <Link to={`/app/jobs/${job.id}/edit`}>
              <Button
                variant="outline"
                leftIcon={<PencilIcon className="h-5 w-5" />}
              >
                {t('common.edit')}
              </Button>
            </Link>
            <Button
              variant="outline"
              leftIcon={<TrashIcon className="h-5 w-5 text-red-500" />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main job details */}
        <div className="md:col-span-2 space-y-6">
          {/* Job details */}
          <Card padding="normal">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('jobs.location')}</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('jobs.contract')}</h3>
                    <p className="mt-1 text-sm text-gray-900">{getContractLabel(job.contractType)}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <CurrencyEuroIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('jobs.salary')}</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.salary || 'Non spécifié'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('jobs.experience')}</h3>
                    <p className="mt-1 text-sm text-gray-900">{getExperienceLabel(job.experienceLevel)}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <LanguageIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('jobs.languages')}</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.languages || 'Non spécifié'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('jobs.startDate')}</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {job.startDate ? formatDate(job.startDate) : 'Non spécifié'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-start">
                  <TagIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('jobs.skills')}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Job description */}
          <Card title={t('jobs.description')} padding="normal">
            <div className="prose max-w-none">
              {job.description.split('\n\n').map((paragraph, index) => (
                <div key={index}>
                  {paragraph.startsWith('##') ? (
                    <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                      {paragraph.replace('## ', '')}
                    </h3>
                  ) : paragraph.startsWith('-') ? (
                    <ul className="list-disc pl-5 my-2">
                      {paragraph.split('\n').map((item, idx) => (
                        <li key={idx} className="text-gray-700">
                          {item.replace('- ', '')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700 mb-4">{paragraph}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          {/* Candidate Stats */}
          <Card title="Candidats" padding="normal">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <span className="text-lg font-semibold">{job.candidates.total}</span>
              </div>
              
              <div className="space-y-2">
                {Object.entries(job.candidates.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-2" 
                        style={{
                          backgroundColor: 
                            status === 'new' ? '#3b82f6' : 
                            status === 'toContact' ? '#f59e0b' :
                            status === 'interview' ? '#8b5cf6' :
                            status === 'hired' ? '#10b981' : '#ef4444'
                        }}
                      />
                      <span className="text-sm text-gray-600">{t(`candidates.statuses.${status}`)}</span>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 flex flex-col space-y-2">
                <Link to={`/app/candidates?jobId=${job.id}`}>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<UserGroupIcon className="h-5 w-5" />}
                  >
                    Voir les candidats
                  </Button>
                </Link>
                <Link to={`/app/candidates/import?jobId=${job.id}`}>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<DocumentArrowUpIcon className="h-5 w-5" />}
                  >
                    Importer des CV
                  </Button>
                </Link>
                <Link to={`/app/reports?jobId=${job.id}`}>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<ChartBarIcon className="h-5 w-5" />}
                  >
                    Voir les stats
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Pipeline Stages */}
          <Card title={t('jobs.pipeline')} padding="normal">
            <div className="space-y-2">
              {job.pipelineStages.map((stage, index) => (
                <div
                  key={index}
                  className="flex items-center p-2 rounded-md"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-800 text-xs font-medium mr-3">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{stage}</span>
                </div>
              ))}
            </div>
          </Card>

          <Link to={`/app/jobs/${job.id}/edit`}>
            <Button
              variant="outline"
              fullWidth
              leftIcon={<PencilIcon className="h-5 w-5" />}
            >
              {t('common.edit')} {t('jobs.title').toLowerCase()}
            </Button>
          </Link>
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
                    Supprimer cette offre d'emploi ?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer cette offre d'emploi ? Cette action est irréversible et supprimera également tous les candidats associés.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleDelete}
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

export default JobDetail;