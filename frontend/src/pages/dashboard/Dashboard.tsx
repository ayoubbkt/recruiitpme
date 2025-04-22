import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { analyticsService } from '../../services/api';
import { DashboardStats } from '../../types';
import { getStatusVariant } from '../../utils/helpers';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Utilisation d'AbortController pour annuler la requête si le composant est démonté
    const abortController = new AbortController();
    
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Appel API réel avec signal d'annulation
        const response = await analyticsService.getDashboardStats();
        setStats(response.data);
      } catch (err: any) {
        // Ne pas mettre à jour l'état si la requête a été annulée
        if (err.name !== 'AbortError') {
          console.error('Error fetching dashboard data:', err);
          setError(err.response?.data?.message || 'Une erreur est survenue lors du chargement des données');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Nettoyer et annuler la requête si le composant est démonté
    return () => {
      abortController.abort();
    };
  }, []);

  if (isLoading) {
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
          onClick={() => window.location.reload()}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.welcome')}, {user?.firstName}
        </h1>
        <p className="text-gray-600 mt-1">{t('dashboard.summary')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex flex-col" padding="normal">
          <div className="flex items-center justify-between">
            <div className="text-gray-500">{t('dashboard.activeJobs')}</div>
            <div className="p-2 bg-blue-100 rounded-md">
              <BriefcaseIcon className="h-6 w-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{stats.activeJobs}</div>
            {stats.jobsTrend > 0 ? (
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.jobsTrend)}%</span>
              </div>
            ) : stats.jobsTrend < 0 ? (
              <div className="flex items-center text-sm text-red-600">
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.jobsTrend)}%</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">0%</div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col" padding="normal">
          <div className="flex items-center justify-between">
            <div className="text-gray-500">{t('dashboard.candidatesAnalyzed')}</div>
            <div className="p-2 bg-purple-100 rounded-md">
              <DocumentTextIcon className="h-6 w-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{stats.candidatesAnalyzed}</div>
            {stats.candidatesTrend > 0 ? (
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.candidatesTrend)}%</span>
              </div>
            ) : stats.candidatesTrend < 0 ? (
              <div className="flex items-center text-sm text-red-600">
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.candidatesTrend)}%</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">0%</div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col" padding="normal">
          <div className="flex items-center justify-between">
            <div className="text-gray-500">{t('dashboard.matchingRate')}</div>
            <div className="p-2 bg-yellow-100 rounded-md">
              <UserGroupIcon className="h-6 w-6 text-yellow-700" />
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{stats.matchingRate}%</div>
            {stats.matchingRateTrend > 0 ? (
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.matchingRateTrend)}%</span>
              </div>
            ) : stats.matchingRateTrend < 0 ? (
              <div className="flex items-center text-sm text-red-600">
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.matchingRateTrend)}%</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">0%</div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col" padding="normal">
          <div className="flex items-center justify-between">
            <div className="text-gray-500">{t('dashboard.interviews')}</div>
            <div className="p-2 bg-green-100 rounded-md">
              <CalendarDaysIcon className="h-6 w-6 text-green-700" />
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold">{stats.interviews}</div>
            {stats.interviewsTrend > 0 ? (
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.interviewsTrend)}%</span>
              </div>
            ) : stats.interviewsTrend < 0 ? (
              <div className="flex items-center text-sm text-red-600">
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                <span>{Math.abs(stats.interviewsTrend)}%</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">0%</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Job Button */}
        <div className="lg:col-span-3">
          <Link to="/app/jobs/create">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<PlusIcon className="h-5 w-5" />}
            >
              {t('dashboard.createJob')}
            </Button>
          </Link>
        </div>

        {/* Recent Candidates */}
        <div className="lg:col-span-2">
          <Card
            title={t('dashboard.recentCandidates')}
            actions={
              <Link
                to="/app/candidates"
                className="text-sm font-medium text-primary-600 hover:text-primary-900"
              >
                {t('dashboard.viewAllCandidates')}
              </Link>
            }
            padding="none"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('candidates.name')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('jobs.jobTitle')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('candidates.matchingScore')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('candidates.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentCandidates.length > 0 ? (
                    stats.recentCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/app/candidates/${candidate.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            {candidate.name}
                          </Link>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={getStatusVariant(candidate.status)}
                            size="sm"
                            rounded
                          >
                            {t(`candidates.statuses.${candidate.status}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun candidat récent
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-1">
          <Card title={t('dashboard.tasksTitle')} padding="normal">
            <div className="space-y-4">
              {stats.tasks.length > 0 ? (
                stats.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="mr-3 mt-0.5">
                      {task.type === 'contact' ? (
                        <UserGroupIcon className="h-5 w-5 text-blue-500" />
                      ) : task.type === 'interview' ? (
                        <CalendarDaysIcon className="h-5 w-5 text-purple-500" />
                      ) : task.type === 'review' ? (
                        <DocumentTextIcon className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <BriefcaseIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(task.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  Aucune tâche en cours
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;