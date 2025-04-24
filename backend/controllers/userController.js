const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');


// Dans backend/controllers/userController.js

/**
 * Met à jour les informations d'entreprise
 * @route PUT /api/users/company
 */
// Dans userController.js, modifiez la fonction updateCompany
exports.updateCompany = async (req, res) => {
  try {
    const { companyName, address, phone, website } = req.body;

    // Validation de base
    if (!companyName) {
      throw new ApiError(400, 'Le nom de l\'entreprise est requis');
    }

    // Mise à jour simplifiée sans relation company
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        companyName
        // Nous ne mettons pas à jour company pour le moment
      }
    });

    res.status(200).json({
      success: true,
      message: 'Informations de l\'entreprise mises à jour avec succès',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        companyName: updatedUser.companyName
      }
    });
  } catch (error) {
    // Gérer l'erreur de manière à ne pas l'afficher dans le frontend
    console.error(`Erreur lors de la mise à jour de l'entreprise: ${error.message}`);
    
    // Utiliser votre fonction respondWithError sans afficher les détails techniques
    return respondWithError(
      res, 
      error.statusCode || 500, 
      "Une erreur est survenue lors de la mise à jour des informations d'entreprise"
    );
  }
};

/**
 * Met à jour les préférences de notification
 * @route PUT /api/users/notifications
 */
exports.updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { emailNotifications, appNotifications } = req.body;

  // Mise à jour des préférences
  const updatedPreferences = await prisma.notificationPreference.upsert({
    where: { userId: req.user.id },
    create: {
      userId: req.user.id,
      emailNewCandidates: emailNotifications?.newCandidates ?? true,
      emailInterviews: emailNotifications?.interviews ?? true,
      emailWeeklyDigest: emailNotifications?.weeklyDigest ?? false,
      appNotificationsEnabled: appNotifications ?? true
    },
    update: {
      emailNewCandidates: emailNotifications?.newCandidates ?? true,
      emailInterviews: emailNotifications?.interviews ?? true,
      emailWeeklyDigest: emailNotifications?.weeklyDigest ?? false,
      appNotificationsEnabled: appNotifications ?? true
    }
  });

  res.status(200).json({
    success: true,
    message: 'Préférences de notification mises à jour avec succès',
    data: updatedPreferences
  });
});

/**
 * Get current user profile
 * @route GET /api/users/profile
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      companyName: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
      _count: {
        select: {
          jobs: true,
          candidates: true,
          interviews: true
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, 'Utilisateur non trouvé');
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Update user profile
 * @route PUT /api/users/profile
 */
exports.updateUserProfile = asyncHandler(async (req, res) => {
    
  const { firstName, lastName, companyName } = req.body;
 

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName,
      lastName,
      companyName
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      companyName: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true
    }
  });

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

/**
 * Update password
 * @route PUT /api/users/password
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password hash
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'Utilisateur non trouvé');
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Mot de passe actuel incorrect');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash }
  });

  res.status(200).json({
    success: true,
    message: 'Mot de passe mis à jour avec succès'
  });
});

/**
 * Delete user account
 * @route DELETE /api/users/account
 */
exports.deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Get user with password hash
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'Utilisateur non trouvé');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Mot de passe incorrect');
  }

  // Delete user account (cascade will delete all related data)
  await prisma.user.delete({
    where: { id: req.user.id }
  });

  res.status(200).json({
    success: true,
    message: 'Compte supprimé avec succès'
  });
});

/**
 * Export all user data (GDPR compliance)
 * @route GET /api/users/data-export
 */
exports.exportUserData = asyncHandler(async (req, res) => {
  // Get user profile data
  const userData = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      companyName: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true
    }
  });

  // Get user's jobs
  const jobs = await prisma.job.findMany({
    where: { userId: req.user.id }
  });

  // Get user's candidates
  const candidates = await prisma.candidate.findMany({
    where: { userId: req.user.id },
    include: {
      job: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  // Get user's interviews
  const interviews = await prisma.interview.findMany({
    where: { interviewerId: req.user.id },
    include: {
      candidate: {
        select: {
          id: true,
          name: true
        }
      },
      job: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  // Get user's notes
  const notes = await prisma.note.findMany({
    where: { userId: req.user.id },
    include: {
      candidate: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Create export object
  const exportData = {
    user: userData,
    jobs,
    candidates,
    interviews,
    notes,
    exportDate: new Date()
  };

  res.status(200).json({
    success: true,
    data: exportData
  });
});