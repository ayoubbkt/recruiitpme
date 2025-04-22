import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { interviewsService } from '../../services/api';
import { Interview } from '../../types';
import { formatDate, formatDateTime, isDateInFuture } from '../../utils/helpers';

const InterviewsList: React.FC = () => {
  const { t } = useTranslation();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Fonction pour charger les entretiens
  const fetchInterviews = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Préparer les paramètres pour l'API
      const params: any = {
        page: pageNum,
        limit: 10,
        search: searchQuery || undefined,
      };
      
      // Ajouter le filtre de date
      if (filter === 'upcoming') {
        params.upcoming = true;
      } else if (filter === 'past') {
        params.past = true;
      }
      
      // Appel API réel
      const response = await interviewsService.getInterviews(params);
      
      // Mise à jour des données avec pagination
      if (refresh) {
        setInterviews(response.data);
      } else {
        setInterviews(prev => [...prev, ...response.data]);
      }
      
      // Mise à jour des informations de pagination
      if (response.pagination) {
        setHasMore(response.pagination.page < response.pagination.totalPages);
      } else {
        setHasMore(false);
      }
      
    } catch (err: any) {
      console.error('Error fetching interviews:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors du chargement des entretiens');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filter]);

  // Chargement initial
  useEffect(() => {
    const abortController = new AbortController();
    
    fetchInterviews(1, true);
    
    return () => {
      abortController.abort();
    };
  }, [fetchInterviews]);

  // Charger plus d'entretiens
  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchInterviews(nextPage);
    }
  };

  // Appliquer les filtres
  const applyFilters = () => {
    setPage(1);
    fetchInterviews(1, true);
  };

  // Mise à jour du statut d'un entretien
  const updateInterviewStatus = async (interviewId: string, status: string) => {
    try {
      await interviewsService.updateInterview(interviewId, { status });
      
      // Mettre à jour localement
      setInterviews(prev => 
        prev.map(interview => 
          interview.id === interviewId 
            ? { ...interview, status: status as any } 
            : interview
        )
      );
    } catch (err: any) {
      console.error('Error updating interview status:', err);
      alert('Une erreur est survenue lors de la mise à jour du statut.');
    }
  };

  const getStatusBadge = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="primary" size="sm" rounded>Planifié</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm" rounded>Terminé</Badge>;
      case 'canceled':
        return <Badge variant="danger" size="sm" rounded>Annulé</Badge>;
      case 'noShow':
        return <Badge variant="warning" size="sm" rounded>No-show</Badge>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          {t('interviews.title')}
        </h1>
        <Link to="/app/interviews/create">
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            {t('interviews.schedule')}
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('common.search')}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        
        <div className="relative inline-block w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as 'all' | 'upcoming' | 'past');
              setTimeout(applyFilters, 0);
            }}
          >
            <option value="all">Tous les entretiens</option>
            <option value="upcoming">{t('interviews.upcoming')}</option>
            <option value="past">{t('interviews.past')}</option>
          </select>
        </div>
        
        <Button
          variant="outline"
          onClick={applyFilters}
        >
          Filtrer
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md text-red-700">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => fetchInterviews(1, true)}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Interviews List */}
      {isLoading && page === 1 ? (
        <div className="h-40 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : interviews.length > 0 ? (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Card key={interview.id} padding="normal" hoverable className="overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-grow md:flex md:items-center">
                  {/* Calendar Icon with Date */}
                  <div className="hidden md:block md:flex-shrink-0 mr-6">
                    <div className="w-16 h-16 bg-primary-50 rounded-lg flex flex-col items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-primary-600" />
                      <span className="mt-1 text-xs font-medium text-primary-900">
                        {formatDate(interview.date)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Interview Details */}
                  <div className="flex-grow">
                    <div className="sm:flex sm:justify-between sm:items-center">
                      <div>
                        <Link
                          to={`/app/interviews/${interview.id}`}
                          className="text-lg font-medium text-primary-600 hover:text-primary-900"
                        >
                          Entretien avec {interview.candidateName}
                        </Link>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>{interview.time}</span>
                          <span className="mx-2">•</span>
                          <span className="md:hidden">{formatDate(interview.date)}</span>
                          <span className="hidden md:inline">{interview.jobTitle}</span>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 dropdown relative">
                        <div>
                          {getStatusBadge(interview.status)}
                        </div>
                        {/* Status update dropdown */}
                        <div className="dropdown-content hidden absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => updateInterviewStatus(interview.id, 'scheduled')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Planifié
                            </button>
                            <button
                              onClick={() => updateInterviewStatus(interview.id, 'completed')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Terminé
                            </button>
                            <button
                              onClick={() => updateInterviewStatus(interview.id, 'noShow')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              No-show
                            </button>
                            <button
                              onClick={() => updateInterviewStatus(interview.id, 'canceled')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Annulé
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {interview.interviewer}
                        </span>
                      </div>
                      {interview.videoLink && (
                        <div className="flex items-center">
                          <VideoCameraIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <a
                            href={interview.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-900 flex items-center"
                          >
                            Lien visio
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2 md:mt-0 md:ml-4 md:flex-shrink-0">
                  <Link to={`/app/candidates/${interview.candidateId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Voir le candidat
                    </Button>
                  </Link>
                  
                  <Link to={`/app/interviews/${interview.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                    >
                      Détails
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Feedback section if completed */}
              {interview.status === 'completed' && interview.feedback && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Compte-rendu</h4>
                      <p className="mt-1 text-sm text-gray-600">{interview.feedback}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Warning for no-show */}
              {interview.status === 'noShow' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Non-présentation</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Le candidat ne s'est pas présenté à l'entretien.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={loadMore}
                isLoading={isLoading}
              >
                Charger plus
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card padding="normal">
          <div className="py-6 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun entretien à afficher</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? "Aucun entretien ne correspond à votre recherche." 
                : filter === 'upcoming' 
                  ? "Vous n'avez pas d'entretiens à venir." 
                  : filter === 'past' 
                    ? "Vous n'avez pas d'entretiens passés." 
                    : "Vous n'avez pas encore programmé d'entretiens."}
            </p>
            <div className="mt-4">
              <Link to="/app/interviews/create">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusIcon className="h-5 w-5" />}
                >
                  {t('interviews.schedule')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InterviewsList;