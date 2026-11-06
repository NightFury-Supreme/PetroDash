const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const cdnDir = path.join(__dirname, '../../cdn');
if (!fs.existsSync(cdnDir)) {
  fs.mkdirSync(cdnDir, { recursive: true });
}

const MAGIC_BYTES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF], offset: 0 },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47], offset: 0 },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

function validateMagicBytes(filePath) {
  try {
    const filename = path.basename(filePath);
    const resolvedCdnDir = path.resolve(__dirname, '../../cdn');
    const safePath = path.resolve(resolvedCdnDir, filename);

    if (!safePath.startsWith(resolvedCdnDir)) {
      return false;
    }

    const fd = fs.openSync(safePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);

    return MAGIC_BYTES.some(({ bytes, offset }) =>
      bytes.every((b, i) => buf[offset + i] === b)
    );
  } catch (_magicReadErr) {
    return false;
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, cdnDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = 'asset_' + crypto.randomBytes(12).toString('hex') + ext;
    cb(null, randomName);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const handleUploadError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size too large. Maximum size is 5MB.', 400, 'ERR_FILE_TOO_LARGE'));
    }
    return next(new AppError('File upload failed', 400, 'ERR_LOCATION_FLAG_UPLOAD_FAILED'));
  } else if (err) {
    return next(new AppError('File upload failed', 400, 'ERR_LOCATION_FLAG_UPLOAD_FAILED'));
  }
  next();
};

const deleteFile = (filePath) => {
  if (!filePath) return false;

  try {
    const filename = path.basename(filePath);
    const safeFilenameRegex = /^(asset_)?[a-f0-9_\-.]+\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;
    if (!safeFilenameRegex.test(filename)) {
      return false;
    }

    const resolvedCdnDir = path.resolve(__dirname, '../../cdn');
    const safePath = path.resolve(resolvedCdnDir, filename);

    if (!safePath.startsWith(resolvedCdnDir + path.sep) && safePath !== resolvedCdnDir) {
      return false;
    }

    if (!fs.existsSync(safePath)) {
      return false;
    }

    fs.unlinkSync(safePath);
    return true;
  } catch (_error) {
    return false;
  }
};

module.exports = {
  upload,
  handleUploadError,
  deleteFile,
  validateMagicBytes,
};
