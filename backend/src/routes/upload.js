const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const { upload, handleUploadError, deleteFile, validateMagicBytes } = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { writeAudit } = require('../middleware/audit');
const AppError = require('../utils/AppError');

const router = express.Router();

const uploadLimiter = createRateLimiter(20, 15 * 60 * 1000);

router.post('/icon', requireAdmin, uploadLimiter, (req, res, next) => {
  upload.single('icon')(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    try {
      if (!req.file) {
        throw AppError.badRequest('No file uploaded', 'ERR_UPLOAD_NO_FILE');
      }

      const cdnDir = path.resolve(__dirname, '../../cdn');
      const safePath = path.resolve(cdnDir, path.basename(req.file.filename));

      if (!safePath.startsWith(cdnDir)) {
        throw AppError.forbidden('Invalid file path', 'ERR_UPLOAD_INVALID_PATH');
      }

      if (!validateMagicBytes(safePath)) {
        try {
          fs.unlinkSync(safePath);
        } catch (_unlinkError) {
        }
        throw AppError.badRequest('File content does not match a valid image', 'ERR_UPLOAD_INVALID_IMAGE');
      }

      const optimizedFilename = `asset_${crypto.randomBytes(12).toString('hex')}.webp`;
      const optimizedPath = path.resolve(cdnDir, optimizedFilename);

      await sharp(safePath)
        .rotate()
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 88, effort: 4 })
        .toFile(optimizedPath);

      try {
        fs.unlinkSync(safePath);
      } catch (_unlinkError) {}

      const stat = fs.statSync(optimizedPath);
      const filePath = `/cdn/${optimizedFilename}`;

      await writeAudit(req, 'admin.upload.icon', 'upload', optimizedFilename, {
        filename: optimizedFilename,
        size: stat.size,
        mimetype: 'image/webp',
      });

      return res.status(200).json({
        filePath,
        filename: optimizedFilename,
        size: stat.size,
        mimetype: 'image/webp',
      });
    } catch (error) {
      next(error instanceof AppError ? error : AppError.internal('Failed to upload file', 'ERR_UPLOAD_FAILED'));
    }
  });
});

router.delete('/icon', requireAdmin, async (req, res, next) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      throw AppError.badRequest('File path is required', 'ERR_UPLOAD_PATH_REQUIRED');
    }

    if (typeof filePath !== 'string' || filePath.length > 255) {
      throw AppError.badRequest('Invalid file path format', 'ERR_UPLOAD_INVALID_FORMAT');
    }

    const deleted = deleteFile(filePath);
    if (!deleted) {
      throw AppError.notFound('File not found or cannot be deleted', 'ERR_UPLOAD_FILE_NOT_FOUND');
    }

    await writeAudit(req, 'admin.upload.delete', 'upload', path.basename(filePath), { filePath });

    return res.status(200).json({ ok: true });
  } catch (error) {
    next(error instanceof AppError ? error : AppError.internal('Failed to delete file', 'ERR_UPLOAD_DELETE_FAILED'));
  }
});

module.exports = router;
