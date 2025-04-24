/**
 * Utilitaire pour formater les réponses API
 * Assure une cohérence dans toutes les réponses
 */

/**
 * Envoie une réponse de succès avec données
 * @param {Object} res - Objet réponse Express
 * @param {Number} statusCode - Code HTTP
 * @param {String} message - Message de succès
 * @param {Object} data - Données à renvoyer
 * @param {Object} pagination - Informations de pagination (facultatif)
 */
const respondWithSuccess = (res, statusCode, message, data, pagination) => {
    const response = {
      success: true,
      message,
      data
    };
  
    if (pagination) {
      response.pagination = pagination;
    }
  
    return res.status(statusCode).json(response);
  };
  
  /**
   * Envoie une réponse d'erreur
   * @param {Object} res - Objet réponse Express
   * @param {Number} statusCode - Code HTTP d'erreur
   * @param {String} message - Message d'erreur
   * @param {Object} errors - Erreurs détaillées (facultatif)
   */
 // Dans utils/apiResponse.js
const respondWithError = (res, statusCode, message, errors) => {
  // En environnement de production, ne pas exposer les détails techniques
  const isProduction = process.env.NODE_ENV === 'production';
  
  const response = {
    success: false,
    message: isProduction && statusCode === 500 ? 
      "Une erreur interne est survenue" : message
  };

  // En développement uniquement, inclure les détails d'erreur
  if (!isProduction && errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
  
  /**
   * Crée un objet pagination
   * @param {Number} page - Page actuelle
   * @param {Number} limit - Nombre d'éléments par page
   * @param {Number} total - Nombre total d'éléments
   */
  const createPagination = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    };
  };
  
  module.exports = { 
    respondWithSuccess, 
    respondWithError,
    createPagination
  };