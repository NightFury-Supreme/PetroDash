const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize original filename - remove any dangerous characters
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // Replace unsafe chars with underscore
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .substring(0, 100); // Limit filename length
    
    // Generate unique filename: timestamp-randomstring-sanitizedname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(sanitizedName).toLowerCase();
    const nameWithoutExt = path.basename(sanitizedName, ext);
    
    // Ensure filename is valid
    const finalName = (nameWithoutExt || 'upload') + '-' + uniqueSuffix + ext;
    cb(null, finalName);
  }
});

// File filter for images only (excluding SVG for security)
const fileFilter = (req, file, cb) => {
  // Removed SVG support due to XSS risks - SVG files can contain JavaScript
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
    
    // Validate filename - only allow safe characters
    const safeFilenameRegex = /^[a-zA-Z0-9_\-\.]+$/;
    if (!safeFilenameRegex.test(filename)) {
      return false;
    }
    
    // Construct the full path
    const fullPath = path.join(__dirname, '../../uploads', filename);
    
    // Ensure the resolved path is still within uploads directory (prevent path traversal)
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    const resolvedPath = path.resolve(fullPath);
    
    if (!resolvedPath.startsWith(uploadsDir)) {
      return false;
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return false;
    }
    
    // Delete the file
    fs.unlinkSync(resolvedPath);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  upload,
  handleUploadError,
  deleteFile
};
