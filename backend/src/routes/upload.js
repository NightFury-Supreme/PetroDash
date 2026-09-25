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
        throw new AppError('No file uploaded', 400, 'ERR_UPLOAD_NO_FILE');
      }

      // Second line of defence: verify actual file content via magic bytes.
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const safePath = path.resolve(uploadsDir, path.basename(req.file.filename));

      if (!safePath.startsWith(uploadsDir)) {
        throw new AppError('Invalid file path', 403, 'ERR_UPLOAD_INVALID_PATH');
      }

      if (!validateMagicBytes(safePath)) {
        try {
          fs.unlinkSync(safePath);
        } catch (_) {}
        throw new AppError('File content does not match a valid image', 400, 'ERR_LOCATION_FLAG_UPLOAD_FAILED');
      }

      const filePath = `/uploads/${req.file.filename}`;

      await writeAudit(req, 'admin.upload.icon', 'upload', req.file.filename, {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      return res.status(200).json({
        message: 'File uploaded successfully',
        filePath,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to upload file', 500, 'ERR_LOCATION_FLAG_UPLOAD_FAILED'));
    }
  });
});

// Delete icon (admin only)
router.delete('/icon', requireAdmin, async (req, res, next) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      throw new AppError('File path is required', 400, 'ERR_UPLOAD_PATH_REQUIRED');
    }

    if (typeof filePath !== 'string' || filePath.length > 255) {
      throw new AppError('Invalid file path format', 400, 'ERR_UPLOAD_INVALID_FORMAT');
    }

    const deleted = deleteFile(filePath);
    if (!deleted) {
      throw new AppError('File not found or cannot be deleted', 404, 'ERR_UPLOAD_FILE_NOT_FOUND');
    }

    await writeAudit(req, 'admin.upload.delete', 'upload', path.basename(filePath), { filePath });

    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Failed to delete file', 500, 'ERR_UPLOAD_DELETE_FAILED'));
  }
});

module.exports = router;
