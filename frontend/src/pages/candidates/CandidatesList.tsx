import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon,
  EllipsisVerticalIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { candidatesService, jobsService } from '../../services/api';
import { Candidate, Job, CandidateFilter } from '../../types';
import { formatDate, getStatusVariant } from '../../utils/helpers';

const CandidatesList: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobIdFilter || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('matchingScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Fonction pour charger les emplois disponibles
  const fetchJobs = useCallback(async () => {
    try {
      const response = await jobsService.getJobs({ status: 'active' });
      setJobs(response.data);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      // Ne pas afficher d'erreur pour ne pas bloquer l'interface
    }
  }, []);

  // Fonction pour charger les candidats avec les filtres actuels
  const fetchCandidates = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      setIsLoading(true);
      
      // Préparer les filtres pour l'API
      const filters: CandidateFilter = {
        page: pageNum,
        limit: 20,
        search: searchQuery || undefined,
        jobId: selectedJobId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy,
        sortDirection,
      };
      
      // Appel API réel
      const response = await candidatesService.getCandidates(filters);
      
      // Mise à jour des données avec pagination
      if (refresh) {
        setCandidates(response.data);
      } else {
        setCandidates(prev => [...prev, ...response.data]);
      }
      
      // Mise à jour des informations de pagination
      if (response.pagination) {
        setHasMore(response.pagination.page < response.pagination.totalPages);
      } else {
        setHasMore(false);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching candidates:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors du chargement des candidats');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedJobId, statusFilter, sortBy, sortDirection]);

  // Chargement initial des emplois et candidats
  useEffect(() => {
    const abortController = new AbortController();
    
    // Mettre à jour selectedJobId à partir de l'URL
    if (jobIdFilter) {
      setSelectedJobId(jobIdFilter);
    }
    
    // Charger les emplois disponibles
    fetchJobs();
    
    // Charger les candidats avec les filtres actuels
    fetchCandidates(1, true);
    
    return () => {
      abortController.abort();
    };
  }, [fetchJobs, fetchCandidates, jobIdFilter]);

  // Gérer le changement de tri
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Inverser la direction si on clique sur le même champ
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Définir un nouveau champ de tri et la direction par défaut
      setSortBy(field);
      setSortDirection(field === 'matchingScore' ? 'desc' : 'asc');
    }
    
    // Remettre à zéro la pagination et recharger les données
    setPage(1);
    setTimeout(() => fetchCandidates(1, true), 0);
  };

  // Charger plus de candidats
  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCandidates(nextPage);
    }
  };

  // Appliquer les filtres
  const applyFilters = () => {
    setPage(1);
    fetchCandidates(1, true);
  };

  // Mettre à jour le statut d'un candidat
  const updateCandidateStatus = async (candidateId: string, newStatus: string) => {
    try {
      await candidatesService.updateCandidateStatus(candidateId, newStatus);
      
      // Mettre à jour localement
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, status: newStatus as any } 
            : candidate
        )
      );
    } catch (err: any) {
      console.error('Error updating candidate status:', err);
      alert('Une erreur est survenue lors de la mise à jour du statut.');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          {t('candidates.title')}
          {selectedJobId && jobs.find(job => job.id === selectedJobId) && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              • {jobs.find(job => job.id === selectedJobId)?.title}
            </span>
          )}
        </h1>
        <Link to="/app/candidates/import">
          <Button
            variant="primary"
            leftIcon={<DocumentArrowUpIcon className="h-5 w-5" />}
          >
            {t('candidates.import')}
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
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
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setTimeout(applyFilters, 0);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="new">{t('candidates.statuses.new')}</option>
            <option value="toContact">{t('candidates.statuses.toContact')}</option>
            <option value="interview">{t('candidates.statuses.interview')}</option>
            <option value="hired">{t('candidates.statuses.hired')}</option>
            <option value="rejected">{t('candidates.statuses.rejected')}</option>
          </select>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BriefcaseIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setTimeout(applyFilters, 0);
            }}
          >
            <option value="">Toutes les offres</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="matchingScore">Trier par score</option>
            <option value="name">Trier par nom</option>
            <option value="experience">Trier par expérience</option>
            <option value="lastActivity">Trier par date</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md text-red-700">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => fetchCandidates(1, true)}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Candidates List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    {t('candidates.name')}
                    {sortBy === 'name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('jobs.jobTitle')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('matchingScore')}
                >
                  <div className="flex items-center">
                    {t('candidates.matchingScore')}
                    {sortBy === 'matchingScore' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('experience')}
                >
                  <div className="flex items-center">
                    {t('candidates.experience')}
                    {sortBy === 'experience' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('candidates.skills')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('candidates.status')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastActivity')}
                >
                  <div className="flex items-center">
                    Activité
                    {sortBy === 'lastActivity' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <Link 
                            to={`/app/candidates/${candidate.id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-900"
                          >
                            {candidate.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {candidate.jobTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`inline-block w-16 h-2 rounded-full ${
                            candidate.matchingScore >= 80
                              ? 'bg-green-500'
                              : candidate.matchingScore >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        ></span>
                        <span className="ml-2 text-sm text-gray-700">
                          {candidate.matchingScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {candidate.experience} {candidate.experience > 1 ? 'ans' : 'an'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="dropdown relative">
                        <Badge
                          variant={getStatusVariant(candidate.status)}
                          size="sm"
                          rounded
                          className="cursor-pointer"
                        >
                          {t(`candidates.statuses.${candidate.status}`)}
                        </Badge>
                        <div className="dropdown-content hidden absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => updateCandidateStatus(candidate.id, 'new')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('candidates.statuses.new')}
                            </button>
                            <button
                              onClick={() => updateCandidateStatus(candidate.id, 'toContact')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('candidates.statuses.toContact')}
                            </button>
                            <button
                              onClick={() => updateCandidateStatus(candidate.id, 'interview')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('candidates.statuses.interview')}
                            </button>
                            <button
                              onClick={() => updateCandidateStatus(candidate.id, 'hired')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('candidates.statuses.hired')}
                            </button>
                            <button
                              onClick={() => updateCandidateStatus(candidate.id, 'rejected')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('candidates.statuses.rejected')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(candidate.lastActivity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="dropdown relative">
                        <button className="p-1 rounded-full hover:bg-gray-100">
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                        </button>
                        <div className="dropdown-content hidden absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <Link 
                              to={`/app/candidates/${candidate.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Voir le profil
                            </Link>
                            <Link 
                              to={`/app/interviews/create?candidateId=${candidate.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t('candidates.scheduleInterview')}
                            </Link>
                            <a
                              href={`mailto:${candidate.email}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Contacter par email
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    {searchQuery || selectedJobId || statusFilter !== 'all' 
                      ? 'Aucun candidat ne correspond à vos filtres' 
                      : 'Aucun candidat pour le moment'}
                    <div className="mt-2">
                      <Link to="/app/candidates/import" className="text-primary-600 hover:text-primary-900">
                        Importer des CV
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination / Load More */}
        {hasMore && candidates.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
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
      </Card>
    </div>
  );
};

export default CandidatesList;