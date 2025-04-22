const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/helpers');
const emailService = require('../services/emailService');
const { respondWithSuccess, respondWithError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Inscrit un nouvel utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return respondWithError(res, 400, 'Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Générer un token de vérification d'email
    const verificationToken = generateToken();

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        companyName,
        verificationToken,
        isEmailVerified: false
      }
    });

    // Envoyer l'email de bienvenue avec le token de vérification
    await emailService.sendWelcomeEmail(user, verificationToken);

    // Masquer le mot de passe et le token dans la réponse
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      isEmailVerified: user.isEmailVerified
    };

    return respondWithSuccess(
      res, 
      201, 
      'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.', 
      userResponse
    );
  } catch (error) {
    logger.error(`Erreur lors de l'inscription: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de l\'inscription', error.message);
  }
};

/**
 * Connecte un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return respondWithError(res, 401, 'Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return respondWithError(res, 401, 'Email ou mot de passe incorrect');
    }

    // Vérifier si l'email est vérifié
    if (!user.isEmailVerified) {
      return respondWithError(res, 401, 'Veuillez vérifier votre email avant de vous connecter');
    }

    // Générer le JWT
    const token = jwt.sign(
      { 
        sub: user.id, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Masquer le mot de passe dans la réponse
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName
    };

    return respondWithSuccess(
      res, 
      200, 
      'Connexion réussie', 
      { user: userResponse, token }
    );
  } catch (error) {
    logger.error(`Erreur lors de la connexion: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la connexion', error.message);
  }
};

/**
 * Vérifie l'email d'un utilisateur avec le token
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Vérifier si un utilisateur a ce token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return respondWithError(res, 400, 'Token de vérification invalide');
    }

    // Marquer l'email comme vérifié et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null
      }
    });

    return respondWithSuccess(
      res, 
      200, 
      'Email vérifié avec succès. Vous pouvez maintenant vous connecter.'
    );
  } catch (error) {
    logger.error(`Erreur lors de la vérification de l'email: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la vérification de l\'email', error.message);
  }
};

/**
 * Demande de réinitialisation de mot de passe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Ne pas indiquer si l'utilisateur existe pour des raisons de sécurité
    if (!user) {
      return respondWithSuccess(
        res,
        200,
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
      );
    }

    // Générer un token de réinitialisation
    const resetToken = generateToken();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24); // Expire dans 24h

    // Enregistrer le token dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Envoyer l'email de réinitialisation
    await emailService.sendPasswordResetEmail(user, resetToken);

    return respondWithSuccess(
      res,
      200,
      'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
    );
  } catch (error) {
    logger.error(`Erreur lors de la demande de réinitialisation de mot de passe: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la demande de réinitialisation', error.message);
  }
};

/**
 * Réinitialise le mot de passe avec un token
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Vérifier si un utilisateur a ce token et s'il n'est pas expiré
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date() // Le token n'est pas expiré
        }
      }
    });

    if (!user) {
      return respondWithError(res, 400, 'Token de réinitialisation invalide ou expiré');
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Mettre à jour le mot de passe et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return respondWithSuccess(
      res, 
      200, 
      'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    );
  } catch (error) {
    logger.error(`Erreur lors de la réinitialisation du mot de passe: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la réinitialisation du mot de passe', error.message);
  }
};

/**
 * Obtient le profil de l'utilisateur connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getProfile = async (req, res) => {
  try {
    // L'utilisateur est déjà disponible dans req.user grâce au middleware d'authentification
    return respondWithSuccess(
      res, 
      200, 
      'Profil récupéré avec succès', 
      req.user
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération du profil: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la récupération du profil', error.message);
  }
};

/**
 * Met à jour le profil de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, companyName } = req.body;
    const userId = req.user.id;

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        companyName
      }
    });

    // Masquer le mot de passe dans la réponse
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      companyName: updatedUser.companyName
    };

    return respondWithSuccess(
      res, 
      200, 
      'Profil mis à jour avec succès', 
      userResponse
    );
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du profil: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors de la mise à jour du profil', error.message);
  }
};

/**
 * Change le mot de passe de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Récupérer l'utilisateur avec le mot de passe actuel
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return respondWithError(res, 401, 'Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    });

    return respondWithSuccess(
      res, 
      200, 
      'Mot de passe changé avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors du changement de mot de passe: ${error.message}`);
    return respondWithError(res, 500, 'Erreur lors du changement de mot de passe', error.message);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
};