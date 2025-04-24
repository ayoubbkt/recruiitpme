const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Schéma de validation pour l'inscription
const registerSchema = Joi.object({
  firstName: Joi.string().required().messages({
    'string.empty': 'Le prénom est requis',
    'any.required': 'Le prénom est requis'
  }),
  lastName: Joi.string().required().messages({
    'string.empty': 'Le nom est requis',
    'any.required': 'Le nom est requis'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Veuillez fournir un email valide',
    'string.empty': 'L\'email est requis',
    'any.required': 'L\'email est requis'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'string.empty': 'Le mot de passe est requis',
    'any.required': 'Le mot de passe est requis'
  }),
  companyName: Joi.string().required().messages({
    'string.empty': 'Le nom de l\'entreprise est requis',
    'any.required': 'Le nom de l\'entreprise est requis'
  })
});

// Schéma de validation pour la connexion
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Veuillez fournir un email valide',
    'string.empty': 'L\'email est requis',
    'any.required': 'L\'email est requis'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Le mot de passe est requis',
    'any.required': 'Le mot de passe est requis'
  })
});

// Schéma pour la vérification d'email
const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Le token est requis',
    'any.required': 'Le token est requis'
  })
});

// Schéma pour la demande de réinitialisation de mot de passe
const requestResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Veuillez fournir un email valide',
    'string.empty': 'L\'email est requis',
    'any.required': 'L\'email est requis'
  })
});

// Schéma pour la réinitialisation de mot de passe
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Le token est requis',
    'any.required': 'Le token est requis'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'string.empty': 'Le mot de passe est requis',
    'any.required': 'Le mot de passe est requis'
  })
});

// Schéma pour la mise à jour du profil
const updateProfileSchema = Joi.object({
  firstName: Joi.string().required().messages({
    'string.empty': 'Le prénom est requis',
    'any.required': 'Le prénom est requis'
  }),
  lastName: Joi.string().required().messages({
    'string.empty': 'Le nom est requis',
    'any.required': 'Le nom est requis'
  }),
  companyName: Joi.string().optional().messages({
    'string.empty': 'Le nom de l\'entreprise est requis',
    'any.required': 'Le nom de l\'entreprise est requis'
  })
});

// Schéma pour le changement de mot de passe
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Le mot de passe actuel est requis',
    'any.required': 'Le mot de passe actuel est requis'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
    'string.empty': 'Le nouveau mot de passe est requis',
    'any.required': 'Le nouveau mot de passe est requis'
  })
});

// Routes d'authentification
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/reset-password', validate(requestResetSchema), authController.requestPasswordReset);
router.post('/reset-password/confirm', validate(resetPasswordSchema), authController.resetPassword);

// Routes protégées (nécessitent une authentification)
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

module.exports = router;