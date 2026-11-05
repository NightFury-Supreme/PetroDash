import { locales } from '@/i18n/routing';

const BLOCKED_AUTH_PATHS = [
  '/login',
  '/register',
  '/auth/callback',
  '/auth',
  '/2fa',
  '/forgot',
  '/verify',
  '/banned',
  '/join',
];

function stripLocalePrefix(path: string): string {
  if (!path) return '/';
  for (const loc of locales) {
    if (path === `/${loc}`) return '/';
    if (path.startsWith(`/${loc}/`)) return path.slice(loc.length + 1);
  }
  return path;
}

export function sanitizeRedirect(
  raw: string | null | undefined,
  defaultPath = '/dashboard'
): string {
  if (!raw || typeof raw !== 'string') {
    return defaultPath;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed === '/' || trimmed === defaultPath) {
    return defaultPath;
  }

  try {
    let decoded = trimmed;
    for (let i = 0; i < 3; i++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      } catch {
        break;
      }
    }

    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) {
      return defaultPath;
    }

    if (
      /[:@]/.test(decoded) ||
      /^\/(https?:|\/\/|www\.)/i.test(decoded) ||
      decoded.includes('://') ||
      /[\x00-\x1F\x7F]/.test(decoded)
    ) {
      return defaultPath;
    }

    const cleanPath = stripLocalePrefix(decoded.toLowerCase());
    for (const blocked of BLOCKED_AUTH_PATHS) {
      if (cleanPath === blocked || cleanPath.startsWith(`${blocked}/`) || cleanPath.startsWith(`${blocked}?`)) {
        return defaultPath;
      }
    }

    return decoded;
  } catch {
    return defaultPath;
  }
}


