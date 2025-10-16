const express = require('express');
const router = express.Router();
const { upload, handleUploadError, deleteFile } = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const path = require('path');

// Rate limiter for upload endpoint - prevent abuse
const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes per IP
  message: 'Too many upload requests, please try again later.'
});

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

      // Return the file path relative to the uploads directory
      const filePath = `/uploads/${req.file.filename}`;
      
      res.status(200).json({
        message: 'File uploaded successfully',
        filePath: filePath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
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

    // Validate the file path format
    if (typeof filePath !== 'string' || filePath.length > 255) {
      return res.status(400).json({ error: 'Invalid file path format' });
    }

    // Attempt to delete the file with security checks
    const deleted = deleteFile(filePath);
    
    if (!deleted) {
      return res.status(404).json({ error: 'File not found or cannot be deleted' });
    }
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
