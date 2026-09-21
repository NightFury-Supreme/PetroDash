import { useState, useCallback, useEffect } from 'react';
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface Settings {
  siteName: string;
  siteIcon: string;
  referrals?: { referrerCoins?: number; referredCoins?: number; customCodeMinInvites?: number };
  auth: {
    emailLogin: boolean;
    emailVerification: boolean;
    discord: {
      enabled: boolean;
      autoJoin: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
      botToken: string;
      guildId: string;
    };
    google: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
    };
  };
  payments: {
    smtp: {
      enabled?: boolean;
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
      fromEmail: string;
    };
    paypal: {
      enabled: boolean;
      mode: 'sandbox' | 'live';
      clientId: string;
      clientSecret: string;
      webhookId: string;
    };
  };
  localization?: {
    currency: string;
  };
  defaults: {
    cpuPercent: number;
    memoryMb: number;
    diskMb: number;
    serverSlots: number;
    backups: number;
    allocations: number;
    databases: number;
    coins: number;
  };
  adsense?: {
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
  };
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setError(null);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication token not found');

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load settings' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      let data: any = {}; try { data = await response.json(); } catch {}
      setSettings(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load settings');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication token not found');

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save settings' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      let data: any = {}; try { data = await response.json(); } catch {}
      setSettings(data);
      return data as Settings;
    } catch (e: any) {
      throw new Error(e.message || 'Failed to save settings');
    }
  }, []);

  useEffect(() => {
    loadSettings().catch(() => {});
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    saveSettings,
    loadSettings
  };
};
