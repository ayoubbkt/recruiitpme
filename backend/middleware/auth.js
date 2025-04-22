const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { respondWithError } = require('../utils/apiResponse');

/**
 * Middleware d'authentification
 * Vérifie que l'utilisateur a fourni un token JWT valide
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token d'autorisation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respondWithError(res, 401, 'Accès non autorisé. Token manquant');
    }

    const token = authHeader.split(' ')[1];

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user) {
      return respondWithError(res, 401, 'Utilisateur non trouvé');
    }

    // Ajouter les informations de l'utilisateur à l'objet de requête
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return respondWithError(res, 401, 'Token invalide');
    }
    if (error.name === 'TokenExpiredError') {
      return respondWithError(res, 401, 'Token expiré');
    }
    return respondWithError(res, 500, 'Erreur lors de l\'authentification');
  }
};

module.exports = { authenticate };