const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const storage = multer.memoryStorage();

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (allowedExtensions.has(ext) && allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Invalid file type. Allowed: JPG, PNG, GIF, WEBP', 'ERR_INVALID_IMAGE_EXT'));
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const handleAvatarUpload = (fieldName = 'avatar') => (req, res, next) => {
  uploadAvatar.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(AppError.badRequest('File size exceeds 5MB limit', 'ERR_FILE_TOO_LARGE'));
        }
        return next(AppError.badRequest('Upload processing failed', 'ERR_UPLOAD_FAILED'));
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  handleAvatarUpload,
};
