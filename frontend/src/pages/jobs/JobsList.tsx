import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { jobsService } from '../../services/api';
import { Job } from '../../types';
import { formatDate, getContractTypeLabel } from '../../utils/helpers';

const JobsList: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalJobs, setTotalJobs] = useState<number>(0);

  const fetchJobs = useCallback(async (page = 1, refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Paramètres pour l'API
      const params = {
        page,
        limit: 10,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      // Appel API réel
      const response = await jobsService.getJobs(params);
      
      // Mise à jour des données avec pagination
      if (refresh) {
        setJobs(response.data);
      } else {
        setJobs(prevJobs => [...prevJobs, ...response.data]);
      }
      
      // Mise à jour des informations de pagination
      if (response.pagination) {
        setTotalJobs(response.pagination.total);
        setHasMore(response.pagination.page < response.pagination.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors du chargement des offres');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Chargement initial des données
  useEffect(() => {
    const abortController = new AbortController();
    
    // Charger les données avec les filtres actuels
    fetchJobs(1, true);
    
    return () => {
      abortController.abort();
    };
  }, [fetchJobs]);

  // Charger plus de données
  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prevPage => prevPage + 1);
      fetchJobs(page + 1);
    }
  };

  // Appliquer les filtres
  const handleFilterChange = () => {
    setPage(1);
    fetchJobs(1, true);
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

  // Supprimer une offre
  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await jobsService.deleteJob(jobId);
        // Rafraîchir la liste après suppression
        fetchJobs(1, true);
      } catch (err: any) {
        console.error('Error deleting job:', err);
        alert(err.response?.data?.message || 'Une erreur est survenue lors de la suppression de l\'offre');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          {t('jobs.title')}
        </h1>
        <Link to="/app/jobs/create">
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            {t('jobs.createTitle')}
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
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
          />
        </div>
        
        <div className="relative inline-block w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setTimeout(handleFilterChange, 0);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">{t('jobs.status.active')}</option>
            <option value="draft">{t('jobs.status.draft')}</option>
            <option value="closed">{t('jobs.status.closed')}</option>
          </select>
        </div>
        
        <Button
          variant="outline"
          onClick={handleFilterChange}
        >
          Filtrer
        </Button>
      </div>

      {/* Jobs List */}
      <Card padding="none">
        {error && (
          <div className="bg-red-50 p-4 text-red-700">
            {error}
            <button
              onClick={() => fetchJobs(1, true)}
              className="ml-3 text-sm underline"
            >
              Réessayer
            </button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('jobs.jobTitle')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('jobs.location')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('jobs.contract')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('candidates.title')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('candidates.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/app/jobs/${job.id}`} className="text-primary-600 hover:text-primary-900 font-medium">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {job.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {job.candidates?.total || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getStatusBadgeVariant(job.status)}
                        size="sm"
                        rounded
                      >
                        {t(`jobs.status.${job.status}`)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <div className="dropdown">
                          <button className="p-1 rounded-full hover:bg-gray-100">
                            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                          </button>
                          <div className="dropdown-content hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <Link 
                                to={`/app/jobs/${job.id}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Voir les détails
                              </Link>
                              <Link 
                                to={`/app/jobs/${job.id}/edit`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Modifier
                              </Link>
                              <Link 
                                to={`/app/candidates/import?jobId=${job.id}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Importer des CV
                              </Link>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    {searchQuery || statusFilter !== 'all' ? 'Aucune offre ne correspond à votre recherche' : 'Aucune offre d\'emploi pour le moment'}
                    <div className="mt-2">
                      <Link to="/app/jobs/create" className="text-primary-600 hover:text-primary-900">
                        Créer votre première offre
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination / Load More */}
        {hasMore && jobs.length > 0 && (
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
        
        {jobs.length > 0 && !hasMore && (
          <div className="px-6 py-4 text-center text-sm text-gray-500 border-t border-gray-200">
            {totalJobs} offres au total
          </div>
        )}
      </Card>
    </div>
  );
};

export default JobsList;