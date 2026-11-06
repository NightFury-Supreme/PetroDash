const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const { invalidateUserCaches } = require('../utils/userCacheInvalidation');

const AVATAR_DIR = path.resolve(__dirname, '../../cdn/avatars');

function ensureAvatarDir() {
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }
}

function getGravatarUrl(email, size = 256) {
  const normalized = (email || '').trim().toLowerCase();
  const hash = crypto.createHash('md5').update(normalized).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${size}`;
}

const DEFAULT_AVATAR_PATH = path.join(AVATAR_DIR, 'default.webp');

async function ensureDefaultAvatar() {
  ensureAvatarDir();
  if (fs.existsSync(DEFAULT_AVATAR_PATH)) {
    return '/cdn/avatars/default.webp';
  }
  try {
    const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="#1e1e1e"/>
      <circle cx="128" cy="96" r="48" fill="#555555"/>
      <path d="M48 216c0-44.183 35.817-80 80-80s80 35.817 80 80" fill="#555555"/>
    </svg>`;
    const webpBuffer = await sharp(Buffer.from(svgFallback))
      .resize(256, 256)
      .webp({ quality: 85 })
      .toBuffer();
    const tempPath = `${DEFAULT_AVATAR_PATH}.${Date.now()}.${Math.random().toString(36).substring(2)}.tmp`;
    await fs.promises.writeFile(tempPath, webpBuffer);
    await fs.promises.rename(tempPath, DEFAULT_AVATAR_PATH);
  } catch (_defaultAvatarErr) { }
  return '/cdn/avatars/default.webp';
}

function resolveAvatar(user) {
  const profilePicture = typeof user === 'string' ? user : user?.profilePicture;
  if (profilePicture && typeof profilePicture === 'string' && profilePicture.trim()) {
    const trimmed = profilePicture.trim();
    if (trimmed.startsWith('/cdn/avatars/')) {
      const filename = path.basename(trimmed);
      const filePath = path.join(AVATAR_DIR, filename);
      if (fs.existsSync(filePath)) {
        return trimmed;
      }
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
  }
  return '/cdn/avatars/default.webp';
}

function getUserAvatarPrefix(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw AppError.internal('ERR_JWT_SECRET_MISSING');
  const userHash = crypto.createHmac('sha256', secret).update(String(userId)).digest('hex').slice(0, 16);
  return `av_${userHash}_`;
}

async function cleanupUserAvatars(userId, keepFilename = '') {
  try {
    ensureAvatarDir();
    const files = await fs.promises.readdir(AVATAR_DIR);
    const userPrefix = getUserAvatarPrefix(userId);
    const deletePromises = files
      .filter((file) => file.startsWith(userPrefix) && file !== keepFilename)
      .map((file) => fs.promises.unlink(path.join(AVATAR_DIR, file)).catch(() => { }));
    await Promise.all(deletePromises);
  } catch (_cleanupError) { }
}

async function processAndSaveAvatar(buffer, userId) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw AppError.badRequest('Invalid or empty image file', 'ERR_INVALID_IMAGE_BUFFER');
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw AppError.badRequest('Image file exceeds 5MB limit', 'ERR_FILE_TOO_LARGE');
  }

  let metadata;
  try {
    metadata = await sharp(buffer, { failOnError: true, limitInputPixels: 4096 * 4096 }).metadata();
  } catch (_metadataError) {
    throw AppError.badRequest('Corrupted or invalid image format', 'ERR_INVALID_IMAGE_DATA');
  }

  const allowedFormats = ['jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'avif'];
  if (!metadata.format || !allowedFormats.includes(metadata.format)) {
    throw AppError.badRequest('Unsupported image format', 'ERR_UNSUPPORTED_IMAGE_FORMAT');
  }

  ensureAvatarDir();

  const userPrefix = getUserAvatarPrefix(userId);
  const fileToken = crypto.randomBytes(8).toString('hex');
  const filename = `${userPrefix}${fileToken}.webp`;
  const targetPath = path.join(AVATAR_DIR, filename);

  const compressedBuffer = await sharp(buffer, { failOnError: true, limitInputPixels: 4096 * 4096 })
    .rotate()
    .resize(256, 256, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  await fs.promises.writeFile(targetPath, compressedBuffer);
  await cleanupUserAvatars(userId, filename);

  return `/cdn/avatars/${filename}`;
}

async function downloadAvatarFromUrl(url, userId) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw AppError.badRequest('Invalid avatar URL protocol', 'ERR_INVALID_URL');
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.')
  ) {
    throw AppError.badRequest('Private network addresses not allowed', 'ERR_INVALID_URL');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PetroDash-AvatarSync/1.0' },
    });
  } catch (_fetchError) {
    clearTimeout(timeoutId);
    throw AppError.badRequest('Failed to download avatar image', 'ERR_AVATAR_DOWNLOAD_FAILED');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw AppError.badRequest('Failed to fetch avatar image from provider', 'ERR_AVATAR_DOWNLOAD_FAILED');
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > 5 * 1024 * 1024) {
    throw AppError.badRequest('Avatar file exceeds 5MB limit', 'ERR_FILE_TOO_LARGE');
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return processAndSaveAvatar(buffer, userId);
}

async function invalidateUserAvatarCaches(userId) {
  await invalidateUserCaches(userId).catch(() => { });
}

async function syncOAuthAvatar(user, provider) {
  let avatarUrl = null;
  if (provider === 'discord') {
    const discord = user.oauthProviders?.discord;
    if (
      discord?.id &&
      typeof discord.id === 'string' &&
      /^[0-9]{17,20}$/.test(discord.id) &&
      discord?.avatar &&
      typeof discord.avatar === 'string' &&
      /^[a-zA-Z0-9_]+$/.test(discord.avatar)
    ) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=256`;
    }
  } else if (provider === 'google') {
    const google = user.oauthProviders?.google;
    const picture = google?.picture;
    if (picture && typeof picture === 'string') {
      let parsed = null;
      try {
        parsed = new URL(picture.trim());
      } catch (_urlParseError) {
        parsed = null;
      }
      if (parsed !== null) {
        const host = parsed.hostname.toLowerCase();
        if (
          parsed.protocol === 'https:' &&
          (host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com'))
        ) {
          let urlStr = parsed.toString();
          if (/=s\d+(-c)?$/i.test(urlStr)) {
            urlStr = urlStr.replace(/=s\d+(-c)?$/i, '=s256-c');
          } else if (!urlStr.includes('=')) {
            urlStr = `${urlStr}=s256-c`;
          }
          avatarUrl = urlStr;
        }
      }
    }
  } else if (provider === 'gravatar') {
    avatarUrl = getGravatarUrl(user.email, 256);
  }

  if (!avatarUrl) {
    throw AppError.badRequest('No avatar found for linked account', 'ERR_OAUTH_NO_AVATAR');
  }

  const localPath = await downloadAvatarFromUrl(avatarUrl, user.publicId);
  user.profilePicture = localPath;
  if (typeof user.save === 'function') {
    await user.save();
  } else if (user._id) {
    await User.findByIdAndUpdate(user._id, { profilePicture: localPath });
  }

  await invalidateUserAvatarCaches(user.publicId);

  return localPath;
}

async function resetAvatarToGravatar(user) {
  const gravatarUrl = getGravatarUrl(user.email, 256);
  const localPath = await downloadAvatarFromUrl(gravatarUrl, user.publicId);
  user.profilePicture = localPath;
  if (typeof user.save === 'function') {
    await user.save();
  } else if (user._id) {
    await User.findByIdAndUpdate(user._id, { profilePicture: localPath });
  }
  await invalidateUserAvatarCaches(user.publicId);
  return localPath;
}

async function ensureUserAvatarOnCdn(user) {
  if (user?.profilePicture && typeof user.profilePicture === 'string' && user.profilePicture.startsWith('/cdn/avatars/')) {
    const filename = path.basename(user.profilePicture);
    const filePath = path.join(AVATAR_DIR, filename);
    if (fs.existsSync(filePath)) {
      return user.profilePicture;
    }
  }
  try {
    if (user?.oauthProviders?.discord?.id && user?.oauthProviders?.discord?.avatar) {
      return await syncOAuthAvatar(user, 'discord');
    }
    if (user?.oauthProviders?.google?.picture) {
      return await syncOAuthAvatar(user, 'google');
    }
  } catch (_syncErr) { }

  try {
    if (user?.email && user?.publicId) {
      return await syncOAuthAvatar(user, 'gravatar');
    }
  } catch (_gravatarErr) { }

  await ensureDefaultAvatar();
  return '/cdn/avatars/default.webp';
}

module.exports = {
  getGravatarUrl,
  resolveAvatar,
  cleanupUserAvatars,
  processAndSaveAvatar,
  downloadAvatarFromUrl,
  syncOAuthAvatar,
  resetAvatarToGravatar,
  ensureUserAvatarOnCdn,
  ensureDefaultAvatar,
  invalidateUserAvatarCaches,
};
