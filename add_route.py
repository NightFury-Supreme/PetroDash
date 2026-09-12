with open('backend/src/routes/upload.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    \"const { requireAdmin } = require('../middleware/auth');\",
    \"const { requireAdmin, requireAuth } = require('../middleware/auth');\"
)

avatar_route = '''
// Upload avatar (authenticated users)
router.post('/avatar', requireAuth, uploadLimiter, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const safePath = path.resolve(uploadsDir, path.basename(req.file.filename));
      
      if (!safePath.startsWith(uploadsDir)) {
        return res.status(403).json({ error: 'Invalid file path' });
      }

      if (!validateMagicBytes(safePath)) {
        try { fs.unlinkSync(safePath); } catch (_) {}
        return res.status(400).json({ error: 'File content does not match a valid image.' });
      }

      const filePath = /uploads/;

      res.status(200).json({
        message: 'Avatar uploaded successfully',
        filePath: filePath
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });
});
'''

code = code.replace(\"module.exports = router;\", avatar_route + \"\nmodule.exports = router;\")

with open('backend/src/routes/upload.js', 'w', encoding='utf-8') as f:
    f.write(code)
