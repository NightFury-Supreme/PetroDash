import { fetchWithRetry } from './fetchWithRetry';

export interface UserResourceLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
  serverSlots: number;
}

export interface UserProfileData {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  coins: number;
  pterodactylUserId?: number | null;
  resources: UserResourceLimits;
  baseResources?: Record<string, number>;
  serverCount: number;
  loginMethod: string;
  profilePicture?: string;
  oauthProviders?: Record<string, unknown>;
  emailVerified: boolean;
  tfaEnabled: boolean;
  hasActivePlans?: boolean;
}

export interface BanDetails {
  reason?: string;
  until?: string | null;
  username?: string;
}

export class AuthError extends Error {
  status: number;
  details?: BanDetails;

  constructor(message: string, status: number, details?: BanDetails) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.details = details;
  }
}

let cachedUser: UserProfileData | null = null;
let lastFetchTimestamp = 0;
let inFlightUserPromise: Promise<UserProfileData | null> | null = null;
const userSubscribers = new Set<(user: UserProfileData | null) => void>();

const CACHE_TTL_MS = 15000;

export function getCachedUserSync(): UserProfileData | null {
  return cachedUser;
}

export function invalidateUserCache(): void {
  cachedUser = null;
  lastFetchTimestamp = 0;
  userSubscribers.forEach((cb) => cb(null));
}

export function mutateCachedUser(
  updater: (prev: UserProfileData | null) => UserProfileData | null
): void {
  cachedUser = updater(cachedUser);
  lastFetchTimestamp = Date.now();
  userSubscribers.forEach((cb) => cb(cachedUser));
}

export function updateCachedUser(updates: Partial<UserProfileData>): void {
  mutateCachedUser((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      ...updates,
      resources: updates.resources ? { ...prev.resources, ...updates.resources } : prev.resources,
      baseResources: updates.baseResources ? { ...prev.baseResources, ...updates.baseResources } : prev.baseResources,
    };
  });
}

export function subscribeUser(cb: (user: UserProfileData | null) => void): () => void {
  userSubscribers.add(cb);
  return () => {
    userSubscribers.delete(cb);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('coins:update', ((e: CustomEvent<{ coins: number }>) => {
    if (typeof e.detail?.coins === 'number') {
      updateCachedUser({ coins: e.detail.coins });
    }
  }) as EventListener);

  window.addEventListener('resources:update', ((e: CustomEvent<{ resources: UserResourceLimits; baseResources?: Record<string, number> }>) => {
    if (e.detail?.resources) {
      updateCachedUser({
        resources: e.detail.resources,
        baseResources: e.detail.baseResources,
      });
    }
  }) as EventListener);

  window.addEventListener('user:refresh', (() => {
    fetchCurrentUser({ force: true }).catch(() => {});
  }) as EventListener);
}

export async function fetchCurrentUser(
  options: { force?: boolean } = {}
): Promise<UserProfileData | null> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) {
    invalidateUserCache();
    return null;
  }

  const isFresh = cachedUser && Date.now() - lastFetchTimestamp < CACHE_TTL_MS;
  if (!options.force && isFresh) {
    return cachedUser;
  }

  if (inFlightUserPromise) {
    return inFlightUserPromise;
  }

  inFlightUserPromise = (async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/me`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (res.status === 403) {
        const d = (await res.json().catch(() => ({}))) as { details?: BanDetails };
        const details: BanDetails = d?.details || {};
        try {
          sessionStorage.setItem('is_banned', 'true');
          sessionStorage.setItem('ban_reason', details.reason || '');
          if (details.until) sessionStorage.setItem('ban_until', String(details.until));
          else sessionStorage.removeItem('ban_until');
          if (details.username) sessionStorage.setItem('ban_username', details.username);
        } catch {}
        invalidateUserCache();
        throw new AuthError('ERR_ACCOUNT_BANNED', 403, details);
      }

      if (res.status === 401) {
        try {
          localStorage.removeItem('auth_token');
        } catch {}
        invalidateUserCache();
        throw new AuthError('ERR_UNAUTHORIZED', 401);
      }

      if (!res.ok) {
        let code = 'ERR_USER_NOT_FOUND';
        try {
          const d = await res.json();
          if (d?.error) code = typeof d.error === 'object' ? d.error.code || d.error.message : d.error;
        } catch {}
        throw new AuthError(code, res.status);
      }

      const data = (await res.json()) as UserProfileData;
      cachedUser = data;
      lastFetchTimestamp = Date.now();
      userSubscribers.forEach((cb) => cb(cachedUser));
      return data;
    } finally {
      inFlightUserPromise = null;
    }
  })();

  return inFlightUserPromise;
}
