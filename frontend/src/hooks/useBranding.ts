'use client';

import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface BrandingInfo {
  siteName: string;
  siteIcon: string;
  currency?: string;
  earnEnabled?: boolean;
  emailVerification?: boolean;
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingInfo>({
    siteName: 'PteroDash',
    siteIcon: '',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchBranding = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const res = await fetchWithRetry(`${base}/api/branding`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (active && data?.siteName) {
          setBranding(data);
        }
      } catch {
        // Fall back to defaults
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBranding();
    return () => {
      active = false;
    };
  }, []);

  return { branding, loading };
}
