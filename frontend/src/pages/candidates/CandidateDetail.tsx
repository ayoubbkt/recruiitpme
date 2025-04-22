import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChartBarIcon,
  PaperClipIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

// Types
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  jobId: string;
  matchingScore: number;
  skills: string[];
  experience: number;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  workExperience: Array<{
    position: string;
    company: string;
    period: string;
    description: string;
  }>;
  languages: string[];
  status: string;
  notes: Array<{
    id: string;
    text: string;
    date: string;
    author: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  lastActivity: string;
}

const CandidateDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>('');
  
  useEffect(() => {
    // In a real application, fetch data from the backend
    const fetchCandidateDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Mock data for demonstration
        const mockCandidate: Candidate = {
          id: id || '1',
          name: 'Sophie Martin',
          email: 'sophie.martin@example.com',
          phone: '06 12 34 56 78',
          location: 'Paris, France',
          jobTitle: 'Développeur Full Stack',
          jobId: '1',
          matchingScore: 92,
          skills: [
            'JavaScript',
            'TypeScript',
            'React',
            'Node.js',
            'MongoDB',
            'Express',
            'Git',
            'Docker',
            'CI/CD',
            'Agile'
          ],
          experience: 5,
          education: [
            {
              degree: 'Master en Informatique',
              institution: 'Université Paris-Saclay',
              year: '2020'
            },
            {
              degree: 'Licence en Mathématiques Appliquées',
              institution: 'Université Pierre et Marie Curie',
              year: '2018'
            }
          ],
          workExperience: [
            {
              position: 'Développeur Full Stack Senior',
              company: 'TechSolutions',
              period: '2022 - Présent',
              description: 'Développement d\'applications web avec React et Node.js. Mise en place de l\'architecture microservices avec Docker et Kubernetes.'
            },
            {
              position: 'Développeur Frontend',
              company: 'WebAgency',
              period: '2020 - 2022',
              description: 'Conception et développement d\'interfaces utilisateur modernes avec React et TypeScript.'
            },
            {
              position: 'Stagiaire Développeur',
              company: 'StartupInnovation',
              period: '2019 - 2020',
              description: 'Participation au développement d\'une application mobile React Native.'
            }
          ],
          languages: ['Français (natif)', 'Anglais (courant)', 'Espagnol (intermédiaire)'],
          status: 'interview',
          notes: [
            {
              id: '1',
              text: 'Entretien téléphonique très positif. Bonnes connaissances techniques et excellente communication.',
              date: '2025-04-15',
              author: 'Marie Dupont'
            },
            {
              id: '2',
              text: 'CV impressionnant avec une solide expérience en développement full stack. À contacter rapidement.',
              date: '2025-04-10',
              author: 'Jean Martin'
            }
          ],
          documents: [
            {
              id: '1',
              name: 'CV_Sophie_Martin.pdf',
              type: 'CV',
              url: '#'
            },
            {
              id: '2',
              name: 'Lettre_Motivation_Sophie_Martin.pdf',
              type: 'Lettre de motivation',
              url: '#'
            }
          ],
          lastActivity: '2025-04-18'
        };
        
        // Simulate API delay
        setTimeout(() => {
          setCandidate(mockCandidate);
          setCurrentStatus(mockCandidate.status);
          setIsLoading(false);
        }, 800);
      } catch (err: any) {
        console.error('Error fetching candidate details:', err);
        setError(err.message || 'Une erreur est survenue');
        setIsLoading(false);
      }
    };

    fetchCandidateDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      // In a real app, this would be an API call
      // await axios.post(`/api/candidates/${id}/status`, { status: newStatus });
      
      setCurrentStatus(newStatus);
      setCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Simulate API call
      console.log(`Status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      // In a real app, this would be an API call
      // const response = await axios.post(`/api/candidates/${id}/notes`, { text: newNote });
      
      const newNoteObj = {
        id: Math.random().toString(36).substr(2, 9),
        text: newNote,
        date: new Date().toISOString().split('T')[0],
        author: 'Utilisateur actuel' // In a real app, this would be the current user
      };
      
      setCandidate(prev => prev ? {
        ...prev,
        notes: [newNoteObj, ...prev.notes]
      } : null);
      
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR').format(date);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'toContact':
        return 'warning';
      case 'interview':
        return 'primary';
      case 'hired':
        return 'success';
      case 'rejected':
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

  if (error || !candidate) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error || 'Candidat non trouvé'}</p>
        <button
          onClick={() => navigate('/app/candidates')}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Retour aux candidats
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with candidate info and actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <button
            onClick={() => navigate('/app/candidates')}
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-lg font-medium">
              {candidate.name.split(' ').map(name => name[0]).join('')}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {candidate.name}
              </h1>
              <div className="flex items-center mt-1">
                <BriefcaseIcon className="h-4 w-4 text-gray-500 mr-1" />
                <Link
                  to={`/app/jobs/${candidate.jobId}`}
                  className="text-sm text-primary-600 hover:text-primary-900"
                >
                  {candidate.jobTitle}
                </Link>
                <span className="mx-2 text-gray-300">•</span>
                <Badge
                  variant={getStatusClass(candidate.status)}
                  size="sm"
                  rounded
                >
                  {t(`candidates.statuses.${candidate.status}`)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={<DocumentTextIcon className="h-5 w-5" />}
            onClick={() => window.open('#')}
          >
            {t('candidates.downloadCV')}
          </Button>
          <Link to={`/app/interviews/create?candidateId=${candidate.id}`}>
            <Button
              variant="primary"
              leftIcon={<CalendarIcon className="h-5 w-5" />}
            >
              {t('candidates.scheduleInterview')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Candidate details */}
        <div className="md:col-span-2 space-y-6">
          {/* Candidate info */}
          <Card padding="normal">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${candidate.email}`} className="text-primary-600 hover:text-primary-900">
                        {candidate.email}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${candidate.phone}`} className="text-primary-600 hover:text-primary-900">
                        {candidate.phone}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Localisation</h3>
                    <p className="mt-1 text-sm text-gray-900">{candidate.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Expérience</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {candidate.experience} {candidate.experience > 1 ? 'ans' : 'an'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-start">
                  <ChartBarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div className="w-full">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-500">Score de matching</h3>
                      <span className="text-sm font-medium text-gray-900">{candidate.matchingScore}%</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          candidate.matchingScore >= 80
                            ? 'bg-green-500'
                            : candidate.matchingScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${candidate.matchingScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Skills section */}
          <Card title="Compétences" padding="normal">
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          {/* Work Experience */}
          <Card title="Expérience professionnelle" padding="normal">
            <div className="space-y-6">
              {candidate.workExperience.map((experience, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 pb-2">
                  <h3 className="text-lg font-medium text-gray-900">{experience.position}</h3>
                  <div className="flex items-center mt-1 mb-2">
                    <BriefcaseIcon className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-700">{experience.company}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-700">{experience.period}</span>
                  </div>
                  <p className="text-sm text-gray-600">{experience.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Education */}
          <Card title="Formation" padding="normal">
            <div className="space-y-4">
              {candidate.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 pb-2">
                  <h3 className="text-base font-medium text-gray-900">{edu.degree}</h3>
                  <div className="flex items-center mt-1">
                    <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-700">{edu.institution}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-700">{edu.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Languages */}
          <Card title="Langues" padding="normal">
            <div className="space-y-2">
              {candidate.languages.map((language, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-sm text-gray-900">{language}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Documents */}
          <Card title="Documents" padding="normal">
            <div className="space-y-3">
              {candidate.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-md">
                      <PaperClipIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.type}</p>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-600 hover:text-primary-900"
                  >
                    Télécharger
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column - Actions and Notes */}
        <div className="md:col-span-1 space-y-6">
          {/* Status Tracker */}
          <Card title="Statut du candidat" padding="normal">
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-2 rounded-md ${currentStatus === 'new' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{t('candidates.statuses.new')}</span>
                </div>
                {currentStatus === 'new' ? (
                  <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                ) : (
                  <button
                    onClick={() => handleStatusChange('new')}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Définir
                  </button>
                )}
              </div>
              
              <div className={`flex items-center justify-between p-2 rounded-md ${currentStatus === 'toContact' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{t('candidates.statuses.toContact')}</span>
                </div>
                {currentStatus === 'toContact' ? (
                  <CheckCircleIcon className="h-5 w-5 text-yellow-500" />
                ) : (
                  <button
                    onClick={() => handleStatusChange('toContact')}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Définir
                  </button>
                )}
              </div>
              
              <div className={`flex items-center justify-between p-2 rounded-md ${currentStatus === 'interview' ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{t('candidates.statuses.interview')}</span>
                </div>
                {currentStatus === 'interview' ? (
                  <CheckCircleIcon className="h-5 w-5 text-purple-500" />
                ) : (
                  <button
                    onClick={() => handleStatusChange('interview')}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Définir
                  </button>
                )}
              </div>
              
              <div className={`flex items-center justify-between p-2 rounded-md ${currentStatus === 'hired' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{t('candidates.statuses.hired')}</span>
                </div>
                {currentStatus === 'hired' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <button
                    onClick={() => handleStatusChange('hired')}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Définir
                  </button>
                )}
              </div>
              
              <div className={`flex items-center justify-between p-2 rounded-md ${currentStatus === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{t('candidates.statuses.rejected')}</span>
                </div>
                {currentStatus === 'rejected' ? (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Définir
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card title="Actions" padding="normal">
            <div className="space-y-3">
              <Link to={`/app/interviews/create?candidateId=${candidate.id}`}>
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<CalendarIcon className="h-5 w-5" />}
                >
                  Planifier un entretien
                </Button>
              </Link>
              <Button
                variant="outline"
                fullWidth
                leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                onClick={() => window.open(`mailto:${candidate.email}`)}
              >
                Envoyer un email
              </Button>
              <Button
                variant="outline"
                fullWidth
                leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                onClick={() => window.open('#')}
              >
                Télécharger le CV
              </Button>
            </div>
          </Card>

          {/* Notes */}
          <Card title="Notes" padding="normal">
            <div className="space-y-4">
              <div>
                <textarea
                  placeholder="Ajoutez une note..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    {t('candidates.addNote')}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {candidate.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900">{note.text}</p>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>{note.author}</span>
                      <span>{formatDate(note.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;