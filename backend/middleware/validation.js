/**
 * Middleware de validation de requête
 * Utilise Joi pour valider les données entrantes
 * @param {Object} schema - Schéma Joi pour la validation
 * @param {String} source - Source des données ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
      const data = req[source];
      const { error, value } = schema.validate(data, {
        abortEarly: false, // Récupérer toutes les erreurs
        stripUnknown: true, // Supprimer les champs non définis dans le schéma
      });
  
      if (error) {
        // Transformer les messages d'erreur Joi en un format plus lisible
        const errors = error.details.map(error => ({
          field: error.path.join('.'),
          message: error.message,
        }));
  
        return res.status(400).json({
          success: false,
          message: 'Validation échouée',
          errors,
        });
      }
  
      // Remplacer les données validées
      req[source] = value;
      next();
    };
  };
  
  module.exports = { validate };