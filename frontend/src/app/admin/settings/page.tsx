"use client";

import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/Shell';
import { AdminSettingsHeader, AdminSettingsContent } from '@/components/admin/settings';
import { AdminSettingsSkeleton } from '@/components/skeletons/admin/settings';
import { useModal } from '@/components/Modal';

interface Settings {
  siteName: string;
  siteIconUrl: string;
  referrals?: { referrerCoins?: number; referredCoins?: number };
  payments: {
    paypal: {
      enabled: boolean;
      mode: 'sandbox' | 'live';
      clientId: string;
      clientSecret: string;
      currency: string;
      webhookId: string;
    };
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load settings' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
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

  const saveSettings = useCallback(async (newSettings: Settings) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/settings`, {
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

      const data = await response.json();
      setSettings(data);
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
      <Shell>
        <div className="p-6">
          <AdminSettingsSkeleton />
        </div>
      </Shell>
    );
  }

  if (error && !settings) {
    return (
      <Shell>
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-400 text-sm"></i>
              </div>
              <div>
                <h4 className="text-red-400 font-medium">Failed to Load Settings</h4>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={loadSettings}
                className="px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                <i className="fas fa-refresh mr-2"></i>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!settings) {
    return (
      <Shell>
        <div className="p-6">
          <div className="bg-[#181818] border border-[#303030] rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#202020] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-[#AAAAAA] text-xl"></i>
            </div>
            <h3 className="text-white font-medium mb-2">No Settings Found</h3>
            <p className="text-[#AAAAAA] text-sm">Unable to load system settings.</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <AdminSettingsHeader />
        <AdminSettingsContent
          settings={settings}
          loading={loading}
          onSave={saveSettings}
          onReload={loadSettings}
        />
      </div>
    </Shell>
  );
}


