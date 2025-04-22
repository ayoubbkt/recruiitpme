const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

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

// Filtres pour les types de fichiers
const fileFilter = (req, file, cb) => {
  // Accepter uniquement les PDF et DOCX pour les CV
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non pris en charge. Veuillez fournir un fichier PDF ou DOCX.'), false);
  }
};

// Configuration du stockage
const getStorage = () => {
  // En production: stockage sur S3
  if (process.env.NODE_ENV === 'production') {
    return multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET_NAME,
      acl: 'private',
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, `cvs/${uniqueName}`);
      }
    });
  } 
  // En développement: stockage local
  else {
    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(__dirname, '..', 'uploads', 'cvs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    return multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }
};

// Middleware d'upload de CV
const uploadCV = multer({
  storage: getStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB par défaut
  }
});

// Gestion des erreurs d'upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux. Taille maximale: 10Mo'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur d'upload: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  uploadCV,
  handleUploadError
};