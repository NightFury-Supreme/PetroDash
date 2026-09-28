/* ==========================================================================
   useAuthSettings Hook
   Compliance: ISO/IEC 25010 (Separation of Concerns, Co-location)
========================================================================== */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface AuthSettings {
  emailLogin: boolean;
  emailVerification: boolean;
  discord: {
    enabled: boolean;
  };
  google: {
    enabled: boolean;
  };
}

export function useAuthSettings() {
  const tError = useTranslations('GlobalErrors');
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      try {
        const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/`);
        if (!response.ok) {
          throw new Error('ERR_AUTH_CONFIG_FAILED');
        }
        let data: any = {};
        try {
          data = await response.json();
        } catch {}

        if (mounted) {
          setSettings(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : tError('unknownError'));
          setSettings({
            emailLogin: true,
            emailVerification: true,
            discord: { enabled: false },
            google: { enabled: false },
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, [tError]);

  return { settings, loading, error };
}
