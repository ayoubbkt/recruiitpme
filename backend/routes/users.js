const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', userController.getUserProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  [
    body('firstName').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
    body('lastName').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('companyName').optional().notEmpty().withMessage('Le nom de l\'entreprise ne peut pas être vide'),
    validate
  ],
  userController.updateUserProfile
);

/**
 * @route PUT /api/users/password
 * @desc Update password
 * @access Private
 */
router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères'),
    validate
  ],
  userController.updatePassword
);

/**
 * @route DELETE /api/users/account
 * @desc Delete user account
 * @access Private
 */
router.delete(
  '/account',
  [
    body('password').notEmpty().withMessage('Le mot de passe est requis pour confirmer la suppression'),
    validate
  ],
  userController.deleteAccount
);

/**
 * @route GET /api/users/data-export
 * @desc Export all user data (GDPR compliance)
 * @access Private
 */
router.get('/data-export', userController.exportUserData);

module.exports = router;