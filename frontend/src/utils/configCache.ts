import { fetchWithRetry } from './fetchWithRetry';
import type { AdSenseSettings } from '@/components/ads/adTypes';

export interface BrandingConfig {
  siteName: string;
  siteIcon: string;
}

export interface LocalizationConfig {
  currency: string;
  timezone?: string;
}

export interface AuthConfig {
  emailLogin: boolean;
  emailVerification: boolean;
  discord: {
    enabled: boolean;
  };
  google: {
    enabled: boolean;
  };
}

export interface EarnConfig {
  enabled: boolean;
}

export interface AppConfig {
  branding: BrandingConfig;
  localization: LocalizationConfig;
  auth: AuthConfig;
  ads: AdSenseSettings;
  earn: EarnConfig;
}

export interface BrandingInfo {
  siteName: string;
  siteIcon: string;
  currency: string;
  earnEnabled: boolean;
  emailVerification: boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  branding: {
    siteName: 'PetroDash',
    siteIcon: '',
  },
  localization: {
    currency: 'USD',
    timezone: '',
  },
  auth: {
    emailLogin: true,
    emailVerification: false,
    discord: { enabled: false },
    google: { enabled: false },
  },
  ads: {
    enabled: false,
    publisherId: '',
    adSlots: { header: '', sidebar: '', footer: '', content: '', mobile: '' },
    adTypes: { display: true, text: true, link: true, inFeed: false, inArticle: false, matchedContent: false },
  },
  earn: {
    enabled: false,
  },
};

const CONFIG_STORAGE_KEY = 'petrodash_app_config';

function loadPersistedConfig(): AppConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.branding && parsed.ads) {
      return parsed as AppConfig;
    }
  } catch {
    return null;
  }
  return null;
}

function persistConfig(cfg: AppConfig): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

let cachedConfig: AppConfig | null = loadPersistedConfig();
let inFlightPromise: Promise<AppConfig> | null = null;
const subscribers = new Set<(config: AppConfig) => void>();

export function isConfigLoaded(): boolean {
  return cachedConfig !== null;
}

export function getCachedAppConfigSync(): AppConfig {
  return cachedConfig || DEFAULT_CONFIG;
}

export function subscribeAppConfig(cb: (config: AppConfig) => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function getCachedBrandingSync(): BrandingInfo {
  const cfg = getCachedAppConfigSync();
  return {
    siteName: cfg.branding.siteName,
    siteIcon: cfg.branding.siteIcon,
    currency: cfg.localization.currency,
    earnEnabled: cfg.earn.enabled,
    emailVerification: cfg.auth.emailVerification,
  };
}

export function subscribeBranding(cb: (info: BrandingInfo) => void): () => void {
  return subscribeAppConfig((cfg) => {
    cb({
      siteName: cfg.branding.siteName,
      siteIcon: cfg.branding.siteIcon,
      currency: cfg.localization.currency,
      earnEnabled: cfg.earn.enabled,
      emailVerification: cfg.auth.emailVerification,
    });
  });
}

export async function fetchBrandingData(force = false): Promise<BrandingInfo> {
  const cfg = await fetchAppConfig(force);
  return {
    siteName: cfg.branding.siteName,
    siteIcon: cfg.branding.siteIcon,
    currency: cfg.localization.currency,
    earnEnabled: cfg.earn.enabled,
    emailVerification: cfg.auth.emailVerification,
  };
}

export async function fetchAppConfig(force = false): Promise<AppConfig> {
  if (!force && cachedConfig) {
    return cachedConfig;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/config`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data === 'object') {
          const branding: BrandingConfig = {
            siteName: data.branding?.siteName || 'PetroDash',
            siteIcon: data.branding?.siteIcon || '',
          };

          const localization: LocalizationConfig = {
            currency: data.localization?.currency || 'USD',
            timezone: data.localization?.timezone || '',
          };

          const auth: AuthConfig = {
            emailLogin: data.auth?.emailLogin ?? true,
            emailVerification: data.auth?.emailVerification ?? false,
            discord: { enabled: Boolean(data.auth?.discord?.enabled) },
            google: { enabled: Boolean(data.auth?.google?.enabled) },
          };

          const ads: AdSenseSettings = data.ads || DEFAULT_CONFIG.ads;

          const earn: EarnConfig = {
            enabled: Boolean(data.earn?.enabled),
          };

          cachedConfig = {
            branding,
            localization,
            auth,
            ads,
            earn,
          };

          persistConfig(cachedConfig);
          subscribers.forEach((cb) => cb(cachedConfig!));
          return cachedConfig;
        }
      }
      return cachedConfig || DEFAULT_CONFIG;
    } catch {
      return cachedConfig || DEFAULT_CONFIG;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}
