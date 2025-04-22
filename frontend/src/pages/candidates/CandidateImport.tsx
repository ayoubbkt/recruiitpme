import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  SparklesIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

interface Job {
  id: string;
  title: string;
}

const CandidateImport: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get('jobId');
  
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(preselectedJobId || '');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fetch available jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Mock data for demonstration
        const mockJobs: Job[] = [
          { id: '1', title: 'Développeur Full Stack' },
          { id: '2', title: 'UX Designer Senior' },
          { id: '3', title: 'Chef de Projet IT' },
          { id: '4', title: 'Développeur Frontend React' },
          { id: '5', title: 'DevOps Engineer' },
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setJobs(mockJobs);
          
          // If there's a preselected job and it exists in our list, select it
          if (preselectedJobId) {
            const jobExists = mockJobs.some(job => job.id === preselectedJobId);
            if (jobExists) {
              setSelectedJobId(preselectedJobId);
            } else {
              setError('L\'offre d\'emploi spécifiée n\'existe pas.');
            }
          }
        }, 500);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Impossible de charger les offres d\'emploi.');
      }
    };

    fetchJobs();
  }, [preselectedJobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        ...file,
        id: Math.random().toString(36).substring(2, 9),
      })) as FileWithPreview[];
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        ...file,
        id: Math.random().toString(36).substring(2, 9),
      })) as FileWithPreview[];
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedJobId) {
      setError('Veuillez sélectionner une offre d\'emploi.');
      return;
    }
    
    if (files.length === 0) {
      setError('Veuillez ajouter au moins un fichier.');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const totalSteps = 10;
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(Math.floor((i / totalSteps) * 100));
      }
      
      // Simulate API call for file upload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsUploading(false);
      setIsAnalyzing(true);
      
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsAnalyzing(false);
      setIsSuccess(true);
      
      // Redirect to candidates list after success
      setTimeout(() => {
        navigate(`/app/candidates?jobId=${selectedJobId}`);
      }, 2000);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Une erreur est survenue lors du téléchargement des fichiers.');
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return validTypes.includes(file.type);
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return (
        <div className="bg-red-100 p-2 rounded-md">
          <DocumentTextIcon className="h-6 w-6 text-red-600" />
        </div>
      );
    }
    return (
      <div className="bg-blue-100 p-2 rounded-md">
        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('candidates.import')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Job Selection */}
          <Card padding="normal">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                {t('candidates.selectJob')}
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={isUploading || isAnalyzing || isSuccess}
              >
                <option value="">Sélectionner une offre</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* File Upload */}
          {!isSuccess && (
            <Card padding="normal">
              <div
                className={`border-2 border-dashed rounded-lg p-6 
                  ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary-400 bg-gray-50 hover:bg-primary-50'}
                  transition-colors duration-150 text-center
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="space-y-3">
                  <div className="mx-auto flex justify-center">
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {t('candidates.uploadInstructions')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('candidates.fileTypes')}
                    </p>
                  </div>
                  <div>
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={isUploading || isAnalyzing || isSuccess}
                    />
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-700 focus-within:outline-none"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isUploading || isAnalyzing || isSuccess}
                      >
                        Sélectionner des fichiers
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-3 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 mr-1" />
                  {error}
                </div>
              )}

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Fichiers sélectionnés ({files.length})
                  </h3>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center">
                          {getFileIcon(file)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-gray-600"
                          disabled={isUploading || isAnalyzing}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Success Message */}
          {isSuccess && (
            <Card padding="normal">
              <div className="text-center py-6">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Analyse terminée avec succès !
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Les CV ont été analysés et les candidats ajoutés à l'offre sélectionnée.
                </p>
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/app/candidates?jobId=${selectedJobId}`)}
                  >
                    Voir les candidats
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          {/* Upload Status */}
          <Card title="Statut" padding="normal">
            <div className="space-y-6">
              {isUploading ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Upload en cours...</span>
                    <span className="text-sm font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-pulse flex flex-col items-center">
                    <SparklesIcon className="h-10 w-10 text-primary-600 mb-3" />
                    <span className="text-sm font-medium text-gray-700">
                      Analyse des CV en cours...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Sélectionnez une offre d'emploi et importez des CV pour les analyser automatiquement.
                  </p>
                  <div className="flex items-center pt-3 border-t border-gray-200">
                    <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm">{files.length} fichiers sélectionnés</span>
                  </div>
                </div>
              )}

              {!isSuccess && (
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  leftIcon={<SparklesIcon className="h-5 w-5" />}
                  onClick={handleUploadAndAnalyze}
                  isLoading={isUploading || isAnalyzing}
                  disabled={files.length === 0 || !selectedJobId || isUploading || isAnalyzing}
                >
                  {t('candidates.analyze')}
                </Button>
              )}
            </div>
          </Card>

          {/* How It Works */}
          <Card title="Comment ça marche" padding="normal">
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600">
                    1
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Sélectionnez une offre</p>
                  <p className="text-xs text-gray-500">Choisissez pour quelle offre vous importez des CV</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600">
                    2
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Importez des CV</p>
                  <p className="text-xs text-gray-500">Formats acceptés : PDF, DOC, DOCX</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600">
                    3
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Analyse automatique</p>
                  <p className="text-xs text-gray-500">
                    Notre IA analyse les CV et extrait les informations pertinentes
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600">
                    4
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Évaluez les candidats</p>
                  <p className="text-xs text-gray-500">
                    Accédez aux profils triés par pertinence pour votre offre
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateImport;