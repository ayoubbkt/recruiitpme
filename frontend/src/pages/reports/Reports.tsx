import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsService, jobsService } from '../../services/api';

import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

// Mock data for demo
interface JobStats {
  id: string;
  title: string;
  candidates: number;
  interviews: number;
  hiredRate: number;
}

interface CandidateStats {
  period: string;
  new: number;
  toContact: number;
  interview: number;
  hired: number;
  rejected: number;
}

interface ConversionStats {
  stage: string;
  rate: number;
  avgDays: number;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [jobStats, setJobStats] = useState<JobStats[]>([]);
  const [candidateStats, setCandidateStats] = useState<CandidateStats[]>([]);
  const [conversionStats, setConversionStats] = useState<ConversionStats[]>([]);
  const [jobs, setJobs] = useState<JobStats[]>([]);

  // Load data on mount
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setIsLoading(true);
  //       setError(null);
        
  //       // Mock data for demonstration
  //       const mockJobStats: JobStats[] = [
  //         { id: '1', title: 'Développeur Full Stack', candidates: 15, interviews: 8, hiredRate: 13.3 },
  //         { id: '2', title: 'UX Designer Senior', candidates: 10, interviews: 5, hiredRate: 20 },
  //         { id: '3', title: 'Chef de Projet IT', candidates: 8, interviews: 4, hiredRate: 12.5 },
  //         { id: '4', title: 'Développeur Frontend React', candidates: 12, interviews: 6, hiredRate: 16.7 },
  //         { id: '5', title: 'DevOps Engineer', candidates: 7, interviews: 3, hiredRate: 14.3 },
  //       ];
        
  //       const mockCandidateStats: CandidateStats[] = [
  //         { period: 'Jan', new: 5, toContact: 3, interview: 2, hired: 1, rejected: 1 },
  //         { period: 'Feb', new: 7, toContact: 5, interview: 3, hired: 2, rejected: 2 },
  //         { period: 'Mar', new: 10, toContact: 8, interview: 6, hired: 2, rejected: 3 },
  //         { period: 'Apr', new: 12, toContact: 9, interview: 5, hired: 3, rejected: 4 },
  //         { period: 'May', new: 8, toContact: 6, interview: 4, hired: 2, rejected: 2 },
  //         { period: 'Jun', new: 15, toContact: 12, interview: 8, hired: 3, rejected: 5 },
  //       ];
        
  //       const mockConversionStats: ConversionStats[] = [
  //         { stage: 'CV Review', rate: 80, avgDays: 3 },
  //         { stage: 'Initial Contact', rate: 60, avgDays: 5 },
  //         { stage: 'Interview', rate: 40, avgDays: 7 },
  //         { stage: 'Final Decision', rate: 30, avgDays: 4 },
  //         { stage: 'Offer Sent', rate: 90, avgDays: 2 },
  //       ];
        
  //       // Simulate API delay
  //       setTimeout(() => {
  //         setJobStats(mockJobStats);
  //         setCandidateStats(mockCandidateStats);
  //         setConversionStats(mockConversionStats);
  //         setIsLoading(false);
  //       }, 1000);
  //     } catch (err: any) {
  //       console.error('Error fetching report data:', err);
  //       setError(err.message || 'Une erreur est survenue');
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Récupérer les offres d'emploi
        const jobsResponse = await jobsService.getJobs({ status: 'active' });
        setJobs(jobsResponse.data);
        
        // Récupérer les statistiques selon les filtres
        const params = {
          jobId: selectedJobId !== 'all' ? selectedJobId : undefined,
          period: periodFilter
        };
        
        // Récupérer les statistiques de conversion
        const conversionResponse = await analyticsService.getConversionStats(params);
        setConversionStats(conversionResponse.data);
        
        // Si une offre spécifique est sélectionnée, récupérer ses statistiques
        if (selectedJobId !== 'all') {
          const jobStatsResponse = await analyticsService.getJobStats(selectedJobId);
          // Mettre à jour l'état avec les statistiques de l'offre
          // Adapter selon la structure de votre réponse API
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.response?.data?.message || 'Une erreur est survenue');
        setIsLoading(false);
      }
    };
  
    fetchData();
    
    return () => {
      abortController.abort();
    };
  }, [selectedJobId, periodFilter]);

  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];
  const STATUS_COLORS = {
    new: '#3b82f6', // blue
    toContact: '#f59e0b', // amber
    interview: '#8b5cf6', // purple
    hired: '#10b981', // green
    rejected: '#ef4444', // red
  };

  const calculateTotalsByStatus = () => {
    const totals = {
      new: 0,
      toContact: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    };

    candidateStats.forEach(period => {
      totals.new += period.new;
      totals.toContact += period.toContact;
      totals.interview += period.interview;
      totals.hired += period.hired;
      totals.rejected += period.rejected;
    });

    return [
      { name: 'New', value: totals.new, color: STATUS_COLORS.new },
      { name: 'To Contact', value: totals.toContact, color: STATUS_COLORS.toContact },
      { name: 'Interview', value: totals.interview, color: STATUS_COLORS.interview },
      { name: 'Hired', value: totals.hired, color: STATUS_COLORS.hired },
      { name: 'Rejected', value: totals.rejected, color: STATUS_COLORS.rejected },
    ];
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          {t('reports.title')}
        </h1>
        <Button
          variant="outline"
          leftIcon={<DocumentArrowDownIcon className="h-5 w-5" />}
          onClick={() => alert('Cette fonctionnalité sera disponible prochainement.')}
        >
          {t('reports.export')}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative inline-block w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="week">Dernière semaine</option>
            <option value="month">Dernier mois</option>
            <option value="quarter">Dernier trimestre</option>
            <option value="year">Dernière année</option>
          </select>
        </div>
        
        <div className="relative inline-block w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BriefcaseIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="all">Toutes les offres</option>
            {jobStats.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex flex-col" padding="normal">
          <div className="text-gray-500">Total Candidats</div>
          <div className="mt-2 text-3xl font-semibold">
            {jobStats.reduce((sum, job) => sum + job.candidates, 0)}
          </div>
        </Card>
        
        <Card className="flex flex-col" padding="normal">
          <div className="text-gray-500">Entretiens Réalisés</div>
          <div className="mt-2 text-3xl font-semibold">
            {jobStats.reduce((sum, job) => sum + job.interviews, 0)}
          </div>
        </Card>
        
        <Card className="flex flex-col" padding="normal">
          <div className="text-gray-500">{t('reports.processingTime')}</div>
          <div className="mt-2 text-3xl font-semibold">
            8 jours
          </div>
        </Card>
        
        <Card className="flex flex-col" padding="normal">
          <div className="text-gray-500">{t('reports.conversionRate')}</div>
          <div className="mt-2 text-3xl font-semibold">
            15%
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Job Performance */}
        <Card title={t('reports.jobPerformance')} padding="normal">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jobStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="candidates" name="Candidats" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="interviews" name="Entretiens" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card title="Distribution des statuts" padding="normal">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={calculateTotalsByStatus()}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {calculateTotalsByStatus().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Candidates Over Time */}
      <Card title="Évolution des candidats" padding="normal" className="mb-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={candidateStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="new" name="Nouveaux" stroke={STATUS_COLORS.new} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="toContact" name="À contacter" stroke={STATUS_COLORS.toContact} />
              <Line type="monotone" dataKey="interview" name="Entretien" stroke={STATUS_COLORS.interview} />
              <Line type="monotone" dataKey="hired" name="Embauchés" stroke={STATUS_COLORS.hired} />
              <Line type="monotone" dataKey="rejected" name="Refusés" stroke={STATUS_COLORS.rejected} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Conversion Pipeline */}
      <Card title="Pipeline de conversion" padding="normal">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={conversionStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rate" name="Taux de conversion (%)" fill="#8884d8" />
              <Bar dataKey="avgDays" name="Temps moyen (jours)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default Reports;