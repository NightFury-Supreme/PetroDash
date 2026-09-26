'use client';

import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface AdSenseSettings {
  enabled: boolean;
  publisherId: string;
  adSlots: {
    header: string;
    sidebar: string;
    footer: string;
    content: string;
    mobile: string;
  };
  adTypes: {
    display: boolean;
    text: boolean;
    link: boolean;
    inFeed: boolean;
    inArticle: boolean;
    matchedContent: boolean;
  };
  adPositions?: {
    showOnDashboard?: boolean;
    showOnShop?: boolean;
    showOnPanel?: boolean;
    showOnAuth?: boolean;
  };
}

export function useAdSenseSettings() {
  const [settings, setSettings] = useState<AdSenseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/ads`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (active && data && typeof data === 'object' && 'enabled' in data) {
            setSettings(data);
          }
        } else {
          if (active) setHasError(true);
        }
      } catch (error) {
        console.error('Failed to load AdSense settings:', error);
        if (active) setHasError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading, hasError };
}
