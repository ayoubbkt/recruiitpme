// User and Authentication Types

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    createdAt: string;
    updatedAt: string;
    notificationPreferences?: {
      emailNewCandidates: boolean;
      emailInterviews: boolean;
      emailWeeklyDigest: boolean;
      appNotificationsEnabled: boolean;
    };
  }
  
  export interface AuthResponse {
    token: string;
    user: User;
  }
  
  // Job Types
  
  export interface Job {
    id: string;
    title: string;
    location: string;
    contractType: 'cdi' | 'cdd' | 'internship' | 'freelance' | 'apprenticeship';
    status: 'active' | 'draft' | 'closed';
    salary?: string;
    experienceLevel: 'junior' | 'intermediate' | 'senior';
    languages?: string;
    startDate?: string;
    description: string;
    skills: string[];
    pipelineStages: string[];
    createdAt: string;
    updatedAt: string;
    candidates: {
      total: number;
      byStatus: Record<string, number>;
    };
  }
  
  export interface JobFormData {
    title: string;
    location: string;
    contractType: string;
    salary?: string;
    experienceLevel: string;
    startDate?: string;
    languages?: string;
    description: string;
    skills: string[];
    pipelineStages: string[];
    status?: 'active' | 'draft' | 'closed';
  }
  
  // Candidate Types
  
  export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    jobId: string;
    jobTitle: string;
    matchingScore: number;
    skills: string[];
    experience: number;
    education?: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    workExperience?: Array<{
      position: string;
      company: string;
      period: string;
      description: string;
    }>;
    languages?: string[];
    status: 'new' | 'toContact' | 'interview' | 'hired' | 'rejected';
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
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CandidateFilter {
    jobId?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }
  
  // Interview Types
  
  export interface Interview {
    id: string;
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    date: string;
    time: string;
    interviewer: string;
    videoLink?: string;
    notes?: string;
    status: 'scheduled' | 'completed' | 'canceled' | 'noShow';
    feedback?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface InterviewFormData {
    candidateId: string;
    date: string;
    time: string;
    interviewer: string;
    videoLink?: string;
    notes?: string;
    sendEmail?: boolean;
  }
  
  // Analytics Types
  
  export interface DashboardStats {
    activeJobs: number;
    candidatesAnalyzed: number;
    matchingRate: number;
    interviews: number;
    recentCandidates: Array<{
      id: string;
      name: string;
      jobTitle: string;
      matchingScore: number;
      status: string;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      type: string;
      date: string;
    }>;
  }
  
  export interface JobAnalytics {
    totalCandidates: number;
    conversionRate: number;
    averageMatchingScore: number;
    timeToHire: number;
    statusDistribution: Record<string, number>;
    candidatesOverTime: Array<{
      date: string;
      count: number;
    }>;
  }
  
  export interface ConversionAnalytics {
    stages: string[];
    conversionRates: number[];
    averageTimePerStage: number[];
  }
  
  // Utility Types
  
  export type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  export type ApiResponse<T> = {
    data: T;
    pagination?: Pagination;
    message?: string;
  };