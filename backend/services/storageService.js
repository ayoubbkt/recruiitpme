const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Configuration AWS S3
let s3;
if (process.env.NODE_ENV === 'production') {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  s3 = new AWS.S3();
}

/**
 * Obtient l'URL signée d'un fichier S3 (production) ou le chemin local (développement)
 * @param {String} key - Clé du fichier (inclut le chemin, ex: 'cvs/file.pdf')
 * @param {Number} expiresIn - Durée de validité de l'URL en secondes (défaut: 60 minutes)
 * @returns {String} - URL signée ou chemin local
 */
const getFileUrl = async (key, expiresIn = 3600) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Générer une URL signée pour S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Expires: expiresIn
      };
      
      return await s3.getSignedUrlPromise('getObject', params);
    } else {
      // En développement, retourner le chemin local
      const localPath = path.join(__dirname, '..', 'uploads', key);
      
      // Vérifier si le fichier existe
      if (!fs.existsSync(localPath)) {
        throw new Error(`Fichier non trouvé: ${localPath}`);
      }
      
      // Retourner le chemin relatif pour accès via l'API
      return `/uploads/${key}`;
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'URL du fichier:', error);
    throw new Error(`Erreur lors de la récupération de l'URL: ${error.message}`);
  }
};

/**
 * Supprime un fichier du stockage
 * @param {String} key - Clé du fichier (inclut le chemin, ex: 'cvs/file.pdf')
 * @returns {Boolean} - Succès de la suppression
 */
const deleteFile = async (key) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Supprimer de S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      };
      
      await s3.deleteObject(params).promise();
      logger.info(`Fichier supprimé de S3: ${key}`);
    } else {
      // Supprimer du stockage local
      const localPath = path.join(__dirname, '..', 'uploads', key);
      
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        logger.info(`Fichier local supprimé: ${localPath}`);
      } else {
        logger.warn(`Fichier local non trouvé: ${localPath}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la suppression du fichier:', error);
    throw new Error(`Erreur lors de la suppression du fichier: ${error.message}`);
  }
};

/**
 * Copie un fichier dans le stockage
 * @param {String} sourceKey - Clé du fichier source
 * @param {String} destinationKey - Clé du fichier destination
 * @returns {Boolean} - Succès de la copie
 */
const copyFile = async (sourceKey, destinationKey) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Copier dans S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        CopySource: `${process.env.AWS_BUCKET_NAME}/${sourceKey}`,
        Key: destinationKey
      };
      
      await s3.copyObject(params).promise();
      logger.info(`Fichier copié dans S3: ${sourceKey} -> ${destinationKey}`);
    } else {
      // Copier localement
      const sourcePath = path.join(__dirname, '..', 'uploads', sourceKey);
      const destinationPath = path.join(__dirname, '..', 'uploads', destinationKey);
      
      if (fs.existsSync(sourcePath)) {
        // Créer le dossier de destination s'il n'existe pas
        const destinationDir = path.dirname(destinationPath);
        if (!fs.existsSync(destinationDir)) {
          fs.mkdirSync(destinationDir, { recursive: true });
        }
        
        // Copier le fichier
        fs.copyFileSync(sourcePath, destinationPath);
        logger.info(`Fichier local copié: ${sourcePath} -> ${destinationPath}`);
      } else {
        logger.warn(`Fichier source non trouvé: ${sourcePath}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la copie du fichier:', error);
    throw new Error(`Erreur lors de la copie du fichier: ${error.message}`);
  }
};

module.exports = {
  getFileUrl,
  deleteFile,
  copyFile
};