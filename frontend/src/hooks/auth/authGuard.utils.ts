import { locales } from '@/i18n/routing';

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/forgot', '/2fa', '/join'];

export function safeSessionSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

export function safeSessionRemove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function safeLocalStorageRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function clearAuthSession() {
  safeSessionRemove('is_banned');
  safeSessionRemove('ban_reason');
  safeSessionRemove('ban_until');
  safeSessionRemove('ban_username');
  safeSessionRemove('verify_email');
}

export function stripLocale(path: string): string {
  if (!path) return '/';
  const withoutQuery = path.split('?')[0].split('#')[0];
  let normalized = withoutQuery;
  for (const loc of locales) {
    if (normalized === `/${loc}`) {
      normalized = '/';
      break;
    }
    if (normalized.startsWith(`/${loc}/`)) {
      normalized = normalized.slice(loc.length + 1);
      break;
    }
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || '/';
}

export function isPublicPath(path: string): boolean {
  const clean = stripLocale(path);
  return (
    PUBLIC_PATHS.some((p) => clean === p || clean.startsWith(`${p}/`)) ||
    clean.startsWith('/banned') ||
    clean.startsWith('/verify')
  );
}

export function getStoredToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  } catch {
    return null;
  }
}
