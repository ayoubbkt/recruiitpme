const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { respondWithSuccess, respondWithError } = require('../utils/apiResponse');
const { daysBetweenDates } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Récupère les statistiques du tableau de bord
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getDashboardStats = async (req, res) => {
  try {
    // Récupérer le nombre d'offres actives
    const activeJobs = await prisma.job.count({
      where: { status: 'active' }
    });

    // Récupérer le nombre de candidats analysés
    const candidatesAnalyzed = await prisma.candidate.count();

    // Calcul de la tendance par rapport au mois précédent
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Candidats du mois précédent
    const previousMonthCandidates = await prisma.candidate.count({
      where: {
        createdAt: {
          lt: oneMonthAgo
        }
      }
    });
    
    // Calcul du % d'augmentation des candidats
    const candidatesTrend = previousMonthCandidates === 0 
      ? 100 // Si aucun candidat le mois précédent, augmentation de 100%
      : Math.round(((candidatesAnalyzed - previousMonthCandidates) / previousMonthCandidates) * 100);
    
    // Offres du mois précédent
    const previousMonthJobs = await prisma.job.count({
      where: {
        createdAt: {
          lt: oneMonthAgo
        },
        status: 'active'
      }
    });
    
    // Calcul du % d'augmentation des offres
    const jobsTrend = previousMonthJobs === 0 
      ? 100 // Si aucune offre le mois précédent, augmentation de 100%
      : Math.round(((activeJobs - previousMonthJobs) / previousMonthJobs) * 100);

    // Récupérer le score de matching moyen
    const candidatesWithScores = await prisma.candidate.findMany({
      select: {
        matchingScore: true
      }
    });
    
    const totalScore = candidatesWithScores.reduce((sum, candidate) => sum + candidate.matchingScore, 0);
    const matchingRate = candidatesWithScores.length > 0 
      ? Math.round(totalScore / candidatesWithScores.length) 
      : 0;
    
    // Calcul tendance du score de matching
    const oneMonthAgoCandidates = await prisma.candidate.findMany({
      where: {
        createdAt: {
          lt: oneMonthAgo
        }
      },
      select: {
        matchingScore: true
      }
    });
    
    const previousMonthScore = oneMonthAgoCandidates.reduce((sum, candidate) => sum + candidate.matchingScore, 0);
    const previousMonthMatchingRate = oneMonthAgoCandidates.length > 0 
      ? Math.round(previousMonthScore / oneMonthAgoCandidates.length) 
      : 0;
    
    const matchingRateTrend = previousMonthMatchingRate === 0 
      ? 100 
      : Math.round(((matchingRate - previousMonthMatchingRate) / previousMonthMatchingRate) * 100);

    // Récupérer le nombre d'entretiens
    const interviews = await prisma.interview.count();
    
    // Calcul tendance des entretiens
    const previousMonthInterviews = await prisma.interview.count({
      where: {
        createdAt: {
          lt: oneMonthAgo
        }
      }
    });
    
    const interviewsTrend = previousMonthInterviews === 0 
      ? 100 
      : Math.round(((interviews - previousMonthInterviews) / previousMonthInterviews) * 100);

    // Récupérer les candidats récents
    const recentCandidates = await prisma.candidate.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,
      include: {
        job: {
          select: {
            title: true
          }
        }
      }
    });

    // Formater les candidats récents
    const formattedRecentCandidates = recentCandidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      jobTitle: candidate.job.title,
      matchingScore: candidate.matchingScore,
      status: candidate.status
    }));

    // Récupérer les tâches à venir (entretiens, candidats à contacter, etc.)
    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        date: {
          gte: new Date()
        },
        status: 'scheduled'
      },
      orderBy: {
        date: 'asc'
      },
      take: 3,
      include: {
        candidate: {
          select: {
            name: true
          }
        }
      }
    });

    const candidatesToContact = await prisma.candidate.findMany({
      where: {
        status: 'toContact'
      },
      orderBy: {
        lastActivity: 'asc'
      },
      take: 2
    });

    const pendingCVReviews = await prisma.candidate.findMany({
      where: {
        status: 'new'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1,
      include: {
        job: {
          select: {
            title: true
          }
        }
      }
    });

    // Formater les tâches
    const tasks = [
      ...upcomingInterviews.map(interview => ({
        id: `interview-${interview.id}`,
        title: `Entretien avec ${interview.candidate.name}`,
        type: 'interview',
        date: interview.date.toISOString().split('T')[0]
      })),
      
      ...candidatesToContact.map(candidate => ({
        id: `contact-${candidate.id}`,
        title: `Contacter ${candidate.name}`,
        type: 'contact',
        date: new Date().toISOString().split('T')[0] // Aujourd'hui
      })),
      
      ...pendingCVReviews.map(candidate => ({
        id: `review-${candidate.id}`,
        title: `Analyser CV pour l'offre ${candidate.job.title}`,
        type: 'review',
        date: new Date().toISOString().split('T')[0] // Aujourd'hui
      }))
    ];

    // Trier les tâches par date
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Préparer la réponse
    const dashboardStats = {
      activeJobs,
      candidatesAnalyzed,
      matchingRate,
      interviews,
      // Tendances
      jobsTrend,
      candidatesTrend,
      matchingRateTrend,
      interviewsTrend,
      // Widgets
      recentCandidates: formattedRecentCandidates,
      tasks
    };

    return respondWithSuccess(
      res,
      200,
      'Statistiques du tableau de bord récupérées avec succès',
      dashboardStats
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des statistiques du tableau de bord: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération des statistiques', error.message);
  }
};

/**
 * Récupère les statistiques d'une offre d'emploi spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getJobStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'offre existe
    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return respondWithError(res, 404, 'Offre non trouvée');
    }

    // Récupérer le nombre total de candidats pour cette offre
    const totalCandidates = await prisma.candidate.count({
      where: { jobId: id }
    });

    // Récupérer la distribution des statuts
    const candidatesByStatus = await prisma.candidate.groupBy({
      by: ['status'],
      where: { jobId: id },
      _count: true
    });

    // Formater la distribution des statuts
    const statusDistribution = {};
    candidatesByStatus.forEach(item => {
      statusDistribution[item.status] = item._count;
    });

    // Calculer le taux de conversion (% de candidats qui arrivent au stade d'entretien ou sont embauchés)
    const interviewedOrHired = await prisma.candidate.count({
      where: {
        jobId: id,
        OR: [
          { status: 'interview' },
          { status: 'hired' }
        ]
      }
    });

    const conversionRate = totalCandidates > 0 
      ? Math.round((interviewedOrHired / totalCandidates) * 100) 
      : 0;

    // Calculer le score de matching moyen
    const candidates = await prisma.candidate.findMany({
      where: { jobId: id },
      select: { matchingScore: true }
    });

    const totalScore = candidates.reduce((sum, candidate) => sum + candidate.matchingScore, 0);
    const averageMatchingScore = candidates.length > 0 
      ? Math.round(totalScore / candidates.length) 
      : 0;

    // Calculer le temps moyen pour embaucher (jours entre création de l'offre et premier candidat embauché)
    let timeToHire = null;
    const hiredCandidate = await prisma.candidate.findFirst({
      where: {
        jobId: id,
        status: 'hired'
      },
      orderBy: {
        updatedAt: 'asc' // Premier candidat embauché
      }
    });

    if (hiredCandidate) {
      timeToHire = daysBetweenDates(job.createdAt, hiredCandidate.updatedAt);
    }

    // Récupérer l'évolution des candidats dans le temps
    // Pour simplifier, on groupe par semaine
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const candidates_over_time = await prisma.candidate.findMany({
      where: {
        jobId: id,
        createdAt: {
          gte: oneMonthAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Regrouper par date (jour)
    const candidatesByDate = {};
    candidates_over_time.forEach(candidate => {
      const date = candidate.createdAt.toISOString().split('T')[0];
      candidatesByDate[date] = (candidatesByDate[date] || 0) + 1;
    });

    // Convertir en tableau pour le front-end
    const candidatesOverTime = Object.entries(candidatesByDate).map(([date, count]) => ({
      date,
      count
    }));

    // Préparer la réponse
    const jobStats = {
      totalCandidates,
      conversionRate,
      averageMatchingScore,
      timeToHire,
      statusDistribution,
      candidatesOverTime
    };

    return respondWithSuccess(
      res,
      200,
      'Statistiques de l\'offre récupérées avec succès',
      jobStats
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des statistiques de l'offre: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération des statistiques', error.message);
  }
};

/**
 * Récupère les taux de conversion du pipeline de recrutement
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getConversionStats = async (req, res) => {
  try {
    const { jobId } = req.query;

    let whereClause = {};
    if (jobId) {
      whereClause.jobId = jobId;
    }

    // Nombre de candidats à chaque étape
    const newCount = await prisma.candidate.count({
      where: {
        ...whereClause,
        status: 'new'
      }
    });

    const toContactCount = await prisma.candidate.count({
      where: {
        ...whereClause,
        status: 'toContact'
      }
    });

    const interviewCount = await prisma.candidate.count({
      where: {
        ...whereClause,
        status: 'interview'
      }
    });

    const hiredCount = await prisma.candidate.count({
      where: {
        ...whereClause,
        status: 'hired'
      }
    });

    const totalCandidates = await prisma.candidate.count({
      where: whereClause
    });

    // Calcul des taux de conversion entre chaque étape
    const calculateRate = (current, previous) => {
      return previous > 0 ? Math.round((current / previous) * 100) : 0;
    };

    const conversionRates = [
      100, // Taux initial (tous les candidats sont nouveaux)
      calculateRate(toContactCount, newCount),
      calculateRate(interviewCount, toContactCount),
      calculateRate(hiredCount, interviewCount)
    ];

    // Temps moyen passé à chaque étape (en jours)
    // Ceci est une simplification, une vraie implémentation nécessiterait de suivre l'historique des changements de status
    const avgTimePerStage = [3, 5, 7, 4]; // Valeurs fictives

    // Préparer la réponse
    const conversionStats = {
      stages: ['Nouveau', 'À contacter', 'Entretien', 'Embauché'],
      conversionRates,
      averageTimePerStage: avgTimePerStage
    };

    return respondWithSuccess(
      res,
      200,
      'Statistiques de conversion récupérées avec succès',
      conversionStats
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des statistiques de conversion: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération des statistiques', error.message);
  }
};

/**
 * Génère un rapport de recrutement (pour export)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const generateReport = async (req, res) => {
  try {
    const { jobId, period, format = 'json' } = req.query;

    // Déterminer la période
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Par défaut: dernier mois
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Construire la clause where
    let whereClause = {
      createdAt: {
        gte: startDate
      }
    };

    if (jobId) {
      whereClause.jobId = jobId;
    }

    // Récupérer les données pour le rapport
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const interviews = await prisma.interview.findMany({
      where: {
        ...(jobId ? { jobId } : {}),
        createdAt: {
          gte: startDate
        }
      },
      include: {
        candidate: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Statistiques générales
    const totalCandidates = candidates.length;
    const candidatesByStatus = candidates.reduce((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    }, {});

    const totalInterviews = interviews.length;
    const interviewsByStatus = interviews.reduce((acc, interview) => {
      acc[interview.status] = (acc[interview.status] || 0) + 1;
      return acc;
    }, {});

    // Calcul du taux de conversion global
    const hiredCount = candidatesByStatus.hired || 0;
    const conversionRate = totalCandidates > 0 
      ? Math.round((hiredCount / totalCandidates) * 100) 
      : 0;

    // Score de matching moyen
    const totalScore = candidates.reduce((sum, candidate) => sum + candidate.matchingScore, 0);
    const averageMatchingScore = candidates.length > 0 
      ? Math.round(totalScore / candidates.length) 
      : 0;

    // Préparer le rapport
    const report = {
      period: period || 'month',
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      summary: {
        totalCandidates,
        candidatesByStatus,
        totalInterviews,
        interviewsByStatus,
        conversionRate,
        averageMatchingScore
      },
      candidates: candidates.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        jobTitle: c.job.title,
        matchingScore: c.matchingScore,
        createdAt: c.createdAt
      })),
      interviews: interviews.map(i => ({
        id: i.id,
        candidateName: i.candidate.name,
        date: i.date,
        status: i.status
      }))
    };

    // Si format est CSV, construire une réponse CSV (simplifiée)
    if (format === 'csv') {
      // TODO: Implémenter l'export CSV
      return respondWithError(res, 501, 'Export CSV non implémenté');
    }

    return respondWithSuccess(
      res,
      200,
      'Rapport généré avec succès',
      report
    );
  } catch (error) {
    logger.error(`Erreur lors de la génération du rapport: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la génération du rapport', error.message);
  }
};

module.exports = {
  getDashboardStats,
  getJobStats,
  getConversionStats,
  generateReport
};