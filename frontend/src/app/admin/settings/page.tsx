"use client";

import { useEffect, useState, useCallback } from 'react';
import { AdminSettingsHeader, AdminSettingsContent } from '@/components/admin/settings';
import { AdminSettingsSkeleton } from '@/components/skeletons/admin/settings';
import { useModal } from '@/components/Modal';

interface Settings {
  siteName: string;
  siteIcon: string; // Changed from siteIconUrl to siteIcon
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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modal = useModal();

  const loadSettings = useCallback(async () => {
    setError(null);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load settings' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      let data: any = {}; try { data = await response.json(); } catch {}
      setSettings(data);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load settings';
      setError(errorMessage);
      await modal.error({
        title: "Failed to Load Settings",
        body: errorMessage || 'An error occurred while loading the settings.'
      });
    } finally {
      setLoading(false);
    }
  }, [modal]);

  const saveSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/settings`, {
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save settings';
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (loading && !settings) {
    return (
      
        <div className="p-6">
          <AdminSettingsSkeleton />
        </div>
      
    );
  }

  if (error || !settings) {
    throw new Error(error || 'Unable to load system settings.');
  }

  if (error) throw new Error(error);

  return (
    
      <div className="p-6 space-y-6">
        <AdminSettingsHeader />
        <AdminSettingsContent
          settings={settings}
          loading={loading}
          onSave={saveSettings}
          onReload={loadSettings}
        />
      </div>
    
  );
}


