const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Magic byte signatures for allowed image types
// These are read from the actual file content — cannot be spoofed by renaming
const MAGIC_BYTES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF],            offset: 0 },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47],     offset: 0 },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38],     offset: 0 },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46],     offset: 0 }, // "RIFF"
];

/**
 * Verify that a saved file's actual bytes match a known image signature.
 * Call this AFTER multer has written the file to disk.
 * Returns true if valid, false otherwise.
 */
function validateMagicBytes(filePath) {
  try {
    // Read only the first 12 bytes — enough for all signatures above
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);

    return MAGIC_BYTES.some(({ bytes, offset }) =>
      bytes.every((b, i) => buf[offset + i] === b)
    );
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (_) {
    return false;
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Only extract the extension from the original name — discard the rest.
    // This prevents leaking user filenames (e.g. "Whatsapp_image.jpg") in URLs.
    const ext = path.extname(file.originalname).toLowerCase();

    // Generate a fully random filename: 24 hex chars + extension
    // e.g. "a3f9c2d1e8b047f6c5a2901d.jpg"
    const randomName = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, randomName);
  }
});

// File filter — first line of defence: validate declared MIME type + extension
const fileFilter = (req, file, cb) => {
  // Removed SVG support due to XSS risks — SVG files can contain JavaScript
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  // Also validate file extension to prevent MIME type spoofing
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Helper function to delete old file with path traversal protection
const deleteFile = (filePath) => {
  if (!filePath) return false;

  try {
    // Remove leading slash and extract just the filename
    const filename = path.basename(filePath);

    // Validate filename — only allow hex chars, dots, and hyphens (matches our generated names)
    const safeFilenameRegex = /^[a-f0-9]+\.(jpg|jpeg|png|gif|webp)$/i;
    if (!safeFilenameRegex.test(filename)) {
      return false;
    }

    // Construct the full path
    const fullPath = path.join(__dirname, '../../uploads', filename);

    // Ensure the resolved path is still within uploads directory (prevent path traversal)
    const resolvedUploadsDir = path.resolve(__dirname, '../../uploads');
    const resolvedPath = path.resolve(fullPath);

    if (!resolvedPath.startsWith(resolvedUploadsDir + path.sep) &&
        resolvedPath !== resolvedUploadsDir) {
      return false;
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return false;
    }

    // Delete the file
    fs.unlinkSync(resolvedPath);
    return true;
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (error) {
    return false;
  }
};

module.exports = {
  upload,
  handleUploadError,
  deleteFile,
  validateMagicBytes,
};
