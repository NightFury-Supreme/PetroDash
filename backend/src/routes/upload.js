const express = require('express');
const router = express.Router();
const { upload, handleUploadError, deleteFile, validateMagicBytes } = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

// Rate limiter: 20 uploads per 15 minutes per IP
const uploadLimiter = createRateLimiter(20, 15 * 60 * 1000);

// Upload icon (admin only)
router.post('/icon', requireAdmin, uploadLimiter, (req, res, next) => {
  upload.single('icon')(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Second line of defence: verify actual file content via magic bytes.
      // This catches files that were renamed (e.g. evil.php → evil.jpg) and
      // bypassed the MIME type / extension filter.
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const safePath = path.resolve(uploadsDir, path.basename(req.file.filename));
      
      if (!safePath.startsWith(uploadsDir)) {
        return res.status(403).json({ error: 'Invalid file path' });
      }

      if (!validateMagicBytes(safePath)) {
        // Delete the already-saved file immediately
        // eslint-disable-next-line unused-imports/no-unused-vars
        try { fs.unlinkSync(safePath); } catch (_) {}
        return res.status(400).json({ error: 'File content does not match a valid image.' });
      }

      // Return only the server-generated path — never echo back the original filename
      const filePath = `/uploads/${req.file.filename}`;

      res.status(200).json({
        message: 'File uploaded successfully',
        filePath: filePath,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });
});

// Delete icon (admin only)
router.delete('/icon', requireAdmin, async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Validate the file path format — must be a string under 255 chars
    if (typeof filePath !== 'string' || filePath.length > 255) {
      return res.status(400).json({ error: 'Invalid file path format' });
    }

    // Attempt to delete the file with security checks
    const deleted = deleteFile(filePath);

    if (!deleted) {
      return res.status(404).json({ error: 'File not found or cannot be deleted' });
    }

    res.status(200).json({ message: 'File deleted successfully' });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
