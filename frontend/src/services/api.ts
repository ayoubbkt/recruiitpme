import axios from 'axios';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  resetPassword: async (email: string) => {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  },
  
  confirmResetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password/confirm', { token, password });
    return response.data;
  },
};

// Jobs service
export const jobsService = {
  getJobs: async (params?: any) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },
  
  getJob: async (id: string) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  
  createJob: async (jobData: any) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },
  
  updateJob: async (id: string, jobData: any) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },
  
  deleteJob: async (id: string) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },
};

// Candidates service
export const candidatesService = {
  getCandidates: async (params?: any) => {
    const response = await api.get('/candidates', { params });
    return response.data;
  },
  
  getCandidate: async (id: string) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },
  
  uploadCandidateFiles: async (jobId: string, files: File[]) => {
    const formData = new FormData();
    formData.append('jobId', jobId);
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await api.post('/candidates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  updateCandidateStatus: async (id: string, status: string) => {
    const response = await api.post(`/candidates/${id}/status`, { status });
    return response.data;
  },
  
  addCandidateNote: async (id: string, text: string) => {
    const response = await api.post(`/candidates/${id}/notes`, { text });
    return response.data;
  },
};

// Interviews service
export const interviewsService = {
  getInterviews: async (params?: any) => {
    const response = await api.get('/interviews', { params });
    return response.data;
  },
  
  getInterview: async (id: string) => {
    const response = await api.get(`/interviews/${id}`);
    return response.data;
  },
  
  createInterview: async (interviewData: any) => {
    const response = await api.post('/interviews', interviewData);
    return response.data;
  },
  
  updateInterview: async (id: string, interviewData: any) => {
    const response = await api.put(`/interviews/${id}`, interviewData);
    return response.data;
  },
  
  deleteInterview: async (id: string) => {
    const response = await api.delete(`/interviews/${id}`);
    return response.data;
  },
  
  addInterviewFeedback: async (id: string, feedback: string) => {
    const response = await api.post(`/interviews/${id}/feedback`, { feedback });
    return response.data;
  },
};

// Analytics service
export const analyticsService = {
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
  
  getJobStats: async (jobId: string) => {
    const response = await api.get(`/analytics/jobs/${jobId}`);
    return response.data;
  },
  
  getConversionStats: async (params?: any) => {
    const response = await api.get('/analytics/conversion', { params });
    return response.data;
  },
  
  generateReport: async (params?: any) => {
    const response = await api.get('/analytics/reports', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  },
};

export default api;