/**
 * Upload Routes
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { upload, handleUploadError, deleteFile, validateMagicBytes } = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { writeAudit } = require('../middleware/audit');
const { logUserActivity } = require('../middleware/userActivity');
const AppError = require('../utils/AppError');

const router = express.Router();

// Rate limiter: 20 uploads per 15 minutes per IP
const uploadLimiter = createRateLimiter(20, 15 * 60 * 1000);

// Upload icon (admin only)
router.post('/icon', requireAdmin, uploadLimiter, (req, res, next) => {
  upload.single('icon')(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    try {
      if (!req.file) {
        throw AppError.badRequest('No file uploaded', 'ERR_UPLOAD_NO_FILE');
      }

      // Second line of defence: verify actual file content via magic bytes.
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const safePath = path.resolve(uploadsDir, path.basename(req.file.filename));

      if (!safePath.startsWith(uploadsDir)) {
        throw AppError.forbidden('Invalid file path', 'ERR_UPLOAD_INVALID_PATH');
      }

      if (!validateMagicBytes(safePath)) {
        try {
          fs.unlinkSync(safePath);
        } catch (_) {}
        throw AppError.badRequest('File content does not match a valid image', 'ERR_UPLOAD_INVALID_IMAGE');
      }

      const filePath = `/uploads/${req.file.filename}`;

      await writeAudit(req, 'admin.upload.icon', 'upload', req.file.filename, {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
      await logUserActivity(req, 'admin.upload.icon', { filename: req.file.filename });

      return res.status(200).json({
        filePath,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      next(error instanceof AppError ? error : AppError.internal('Failed to upload file', 'ERR_UPLOAD_FAILED'));
    }
  });
});

// Delete icon (admin only)
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
    await logUserActivity(req, 'admin.upload.delete', { filePath });

    return res.status(200).json({ ok: true });
  } catch (error) {
    next(error instanceof AppError ? error : AppError.internal('Failed to delete file', 'ERR_UPLOAD_DELETE_FAILED'));
  }
});

module.exports = router;
