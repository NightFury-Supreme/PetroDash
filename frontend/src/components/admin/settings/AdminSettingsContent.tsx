import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { UpdateSystem } from '../updates';
import { Palette, Globe, ShieldCheck, Server, Users, RefreshCw, Mail } from 'lucide-react';
import { Settings, AdminSettingsContentProps } from './types';
import { SideItem, PayPalIcon, GoogleIcon } from './Shared';
import { BrandTab } from './tabs/BrandTab';
import { LocalizationTab } from './tabs/LocalizationTab';
import { AuthTab } from './tabs/AuthTab';
import { EmailTab } from './tabs/EmailTab';
import { ResourcesTab } from './tabs/ResourcesTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { AdSenseTab } from './tabs/AdSenseTab';
import { PayPalTab } from './tabs/PayPalTab';

export function AdminSettingsContent({
  settings,
  loading,
  onSave
}: AdminSettingsContentProps) {
  const [activeTab, setActiveTab] = useState('brand');
  const [formData, setFormData] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const cleanPatch = (patch: Partial<Settings>) => {
    const cleaned: any = { ...patch };
    if (cleaned.auth) {
      cleaned.auth = { ...(cleaned.auth as any) };
      if (cleaned.auth.discord) {
        cleaned.auth.discord = { ...(cleaned.auth.discord as any) };
        if (cleaned.auth.discord.redirectUri === '') {
          delete cleaned.auth.discord.redirectUri;
        }
      }
      if (cleaned.auth.google) {
        cleaned.auth.google = { ...(cleaned.auth.google as any) };
        if (cleaned.auth.google.redirectUri === '') {
          delete cleaned.auth.google.redirectUri;
        }
      }
    }
    return cleaned as Partial<Settings>;
  };

  const saveSection = async (patch: Partial<Settings>, successBody: string) => {
    setSaving(true);
    try {
      const next = await onSave(cleanPatch(patch));
      setFormData(next);
      showSuccess(successBody);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (path: string, value: unknown) => {
    const keys = path.split('.');
    
      if (keys.some(key => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
        return;
      }    
    const newData = Object.create(null);
    Object.assign(newData, formData);
    let current: Record<string, unknown> = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return;
        }
      if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
        current[key] = Object.create(null);
      }
      current = current[key] as Record<string, unknown>;
    }
    
    const finalKey = keys[keys.length - 1];
    if (finalKey !== '__proto__' && finalKey !== 'constructor' && finalKey !== 'prototype') {
      current[finalKey] = value;
      setFormData(newData);
    }
  };

  const tabProps = {
    formData,
    updateFormData,
    saveSection,
    loading: loading || saving
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <aside className="w-full lg:w-48 shrink-0 pt-1">
        <div className="sticky top-6">
          <div className="mb-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Settings</p>
          </div>
          <nav className="flex flex-col gap-1">
            <SideItem icon={Palette} label="Brand" active={activeTab === 'brand'} onClick={() => setActiveTab('brand')} />
            <SideItem icon={Globe} label="Localization" active={activeTab === 'localization'} onClick={() => setActiveTab('localization')} />
            <SideItem icon={ShieldCheck} label="Authentication" active={activeTab === 'auth'} onClick={() => setActiveTab('auth')} />
            <SideItem icon={Mail} label="Email" active={activeTab === 'email'} onClick={() => setActiveTab('email')} />
            <SideItem icon={Server} label="Default Resources" active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
            <SideItem icon={Users} label="Referrals" active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} />
            <SideItem icon={GoogleIcon} label="Google AdSense" active={activeTab === 'adsense'} onClick={() => setActiveTab('adsense')} />
            <SideItem icon={PayPalIcon} label="PayPal" active={activeTab === 'paypal'} onClick={() => setActiveTab('paypal')} />
            <SideItem icon={RefreshCw} label="System Updates" active={activeTab === 'updates'} onClick={() => setActiveTab('updates')} />
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 w-full space-y-6">
        {activeTab === 'brand' && <BrandTab {...tabProps} />}
        {activeTab === 'localization' && <LocalizationTab {...tabProps} />}
        {activeTab === 'referrals' && <ReferralsTab {...tabProps} />}
        {activeTab === 'auth' && <AuthTab {...tabProps} />}
        {activeTab === 'email' && <EmailTab {...tabProps} />}
        {activeTab === 'resources' && <ResourcesTab {...tabProps} />}
        {activeTab === 'adsense' && <AdSenseTab {...tabProps} />}
        {activeTab === 'paypal' && <PayPalTab {...tabProps} />}
        {activeTab === 'updates' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <UpdateSystem />
          </div>
        )}
      </div>
    </div>
  );
}
