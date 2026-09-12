import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { useModal } from '@/components/Modal';
import { UpdateSystem } from '../updates';
import { Palette, Globe, ShieldCheck, Server, Users, Megaphone, CreditCard, RefreshCw, Upload, Trash2, LayoutTemplate, Image as ImageIcon, Coins, Clock, Gift, Mail, Key, ShieldAlert, MessageSquare, Bot, Fingerprint, BadgeDollarSign, Link as LinkIcon, Activity, Database, HardDrive, Cpu, Network } from 'lucide-react';

function SideItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        active 
          ? 'bg-white/10 text-white shadow-sm'
          : 'text-[#888] hover:bg-white/[0.04] hover:text-[#D4D4D4]'
      }`}
    >
      <Icon size={16} className={active ? 'text-white' : 'text-[#888]'} />
      {label}
    </button>
  );
}

interface Settings {
  siteName: string;
  siteIcon: string; // Changed from siteIconUrl to siteIcon
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
    timezone?: string;
  };
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
  referrals?: { referrerCoins?: number; referredCoins?: number; customCodeMinInvites?: number };
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

interface AdminSettingsContentProps {
  settings: Settings;
  loading: boolean;
  onSave: (settings: Partial<Settings>) => Promise<Settings>;
}

function SettingsRow({ 
  icon,
  label, 
  description, 
  children, 
  vertical = false,
  displayValue,
  onSave
}: { 
  icon?: React.ReactNode,
  label: string, 
  description: React.ReactNode, 
  children: React.ReactNode, 
  vertical?: boolean,
  displayValue?: React.ReactNode,
  onSave?: () => Promise<void> | void
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      await onSave();
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-start`}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#222] border border-[#2A2A2A] text-[#D4D4D4]">
              {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
            <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
          </div>
        </div>
        <div className="flex flex-col w-full justify-center">
          {isEditing ? children : (displayValue !== undefined ? <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9">{displayValue}</div> : children)}
        </div>
        <div className="flex items-center justify-end gap-2">
          {displayValue !== undefined && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition"
            >
              <i className="fas fa-pencil-alt text-[10px]"></i> Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition disabled:opacity-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition disabled:cursor-not-allowed bg-[#FF5722] hover:bg-[#F4511E] text-white"
                disabled={isSaving}
              >
                {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save text-[14px]"></i>} Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SiteIconDisplay({ src }: { src: string }) {
  const [error, setError] = React.useState(false);
  
  if (error || !src) return <ImageIcon size={16} />;
  return <img src={src} alt="Icon" className="w-6 h-6 rounded" onError={() => setError(true)} />;
}

export function AdminSettingsContent({
  settings,
  loading,
  onSave
}: AdminSettingsContentProps) {
  const [activeTab, setActiveTab] = useState('brand');
  const [formData, setFormData] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modal = useModal();
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
    
      // Prevent prototype pollution by checking for dangerous keys
      if (keys.some(key => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
        return;
      }    // Create a safe object without prototype
    const newData = Object.create(null);
    Object.assign(newData, formData);
    let current: Record<string, unknown> = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
              // Additional check for each key in the path
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return;
        }
      if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
        current[key] = Object.create(null);
      }
      current = current[key] as Record<string, unknown>;
    }
    
    const finalKey = keys[keys.length - 1];
    // Final check before assignment
    if (finalKey !== '__proto__' && finalKey !== 'constructor' && finalKey !== 'prototype') {
      current[finalKey] = value;
      setFormData(newData);
    }
  };

  const getSafeIconUrl = () => {
    if (iconPreview) return iconPreview;
    if (!formData.siteIcon) return '';
    try {
      const parsedUrl = new URL(formData.siteIcon, process.env.NEXT_PUBLIC_API_BASE || 'http://localhost');
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return '';
      return parsedUrl.href;
    } catch {
      return '';
    }
  };
  const safeSiteIcon = getSafeIconUrl();

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
            <SideItem icon={Server} label="Default Resources" active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
            <SideItem icon={Users} label="Referrals" active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} />
            <SideItem icon={Megaphone} label="Google AdSense" active={activeTab === 'adsense'} onClick={() => setActiveTab('adsense')} />
            <SideItem icon={CreditCard} label="PayPal" active={activeTab === 'paypal'} onClick={() => setActiveTab('paypal')} />
            <SideItem icon={RefreshCw} label="System Updates" active={activeTab === 'updates'} onClick={() => setActiveTab('updates')} />
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 w-full space-y-6">
      {activeTab === 'brand' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* Brand Settings */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Brand Settings</h3>
            <p className="mt-2 text-sm text-white/35">Customize your site appearance</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsRow icon={<LayoutTemplate />} label="Site Name" description="The global name of your application." displayValue={formData.siteName || 'Not set'} onSave={() => saveSection({ siteName: formData.siteName }, 'Brand settings updated.')}>
            <input
              type="text"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder="Enter site name"
              value={formData.siteName || ''}
              onChange={(e) => updateFormData('siteName', e.target.value)}
              disabled={loading}
            />
          </SettingsRow>
          
          <SettingsRow icon={<SiteIconDisplay src={safeSiteIcon || '/logo.svg'} />} label="Site Icon" description="Upload an image (max 5MB, PNG/JPG/GIF/WEBP/SVG)." displayValue="" onSave={async () => {
                  let finalSiteIcon = formData.siteIcon;
                  if (iconFile) {
                    const token = localStorage.getItem('auth_token');
                    const fd = new FormData();
                    fd.append('icon', iconFile);
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                    if (!res.ok) throw new Error('Failed to upload icon');
                    let data: any = {}; try { data = await res.json(); } catch {}
                    finalSiteIcon = data.filePath || data.url;
                  }
                  await saveSection({ siteIcon: finalSiteIcon }, "Brand settings updated.");
                }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-md">
              <div
                className="flex-1 min-w-0"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  setIsDragging(false); 
                  const file = e.dataTransfer.files?.[0];
                  if (!file || !file.type.startsWith('image/')) return;
                  setIconFile(file);
                  setIconPreview(URL.createObjectURL(file));
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !file.type.startsWith('image/')) return;
                    setIconFile(file);
                    setIconPreview(URL.createObjectURL(file));
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className={`flex items-center justify-between w-full rounded-lg px-4 h-[44px] text-sm text-[#888] transition-colors outline-none ${isDragging ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722]' : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'}`}
                >
                  <span className="truncate">
                    {iconPreview || formData.siteIcon ? 'Change icon (or drop/paste)' : 'Upload icon (or drop/paste)'}
                  </span>
                  <Upload size={16} className="text-[#888] shrink-0" />
                </button>
              </div>

              {(iconPreview || formData.siteIcon) && (
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await modal.confirm({
                      title: "Remove Icon",
                      body: "Are you sure you want to remove the site icon?"
                    });
                    if (confirmed) {
                      if (iconPreview) URL.revokeObjectURL(iconPreview);
                      setIconFile(null);
                      setIconPreview(null);
                      if (formData.siteIcon) updateFormData('siteIcon', '');
                    }
                  }}
                  className="flex items-center justify-center h-[44px] w-[44px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                  disabled={loading}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </SettingsRow>
        </div>
      </section>
      </div>
      )}

      {activeTab === 'localization' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* Localization Settings */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Localization Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure global language and currency</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsRow icon={<Coins />} label="Site Currency" description="This currency is displayed on the shop and all plans." displayValue={formData.localization?.currency || 'USD'} onSave={() => saveSection({ localization: formData.localization }, 'Localization settings updated.')}>
            <select
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              value={formData.localization?.currency || 'USD'}
              onChange={(e) => updateFormData('localization.currency', e.target.value)}
              disabled={loading}
            >
              <option value="USD" className="bg-[#202020] text-white">USD - US Dollar</option>
              <option value="EUR" className="bg-[#202020] text-white">EUR - Euro</option>
              <option value="GBP" className="bg-[#202020] text-white">GBP - British Pound</option>
              <option value="INR" className="bg-[#202020] text-white">INR - Indian Rupee</option>
              <option value="CAD" className="bg-[#202020] text-white">CAD - Canadian Dollar</option>
              <option value="AUD" className="bg-[#202020] text-white">AUD - Australian Dollar</option>
              <option value="JPY" className="bg-[#202020] text-white">JPY - Japanese Yen</option>
              <option value="CHF" className="bg-[#202020] text-white">CHF - Swiss Franc</option>
              <option value="NZD" className="bg-[#202020] text-white">NZD - New Zealand Dollar</option>
              <option value="SEK" className="bg-[#202020] text-white">SEK - Swedish Krona</option>
              <option value="DKK" className="bg-[#202020] text-white">DKK - Danish Krone</option>
              <option value="NOK" className="bg-[#202020] text-white">NOK - Norwegian Krone</option>
              <option value="PLN" className="bg-[#202020] text-white">PLN - Polish Złoty</option>
              <option value="CZK" className="bg-[#202020] text-white">CZK - Czech Koruna</option>
              <option value="HUF" className="bg-[#202020] text-white">HUF - Hungarian Forint</option>
              <option value="BRL" className="bg-[#202020] text-white">BRL - Brazilian Real</option>
              <option value="MXN" className="bg-[#202020] text-white">MXN - Mexican Peso</option>
              <option value="SGD" className="bg-[#202020] text-white">SGD - Singapore Dollar</option>
              <option value="HKD" className="bg-[#202020] text-white">HKD - Hong Kong Dollar</option>
              <option value="CNY" className="bg-[#202020] text-white">CNY - Chinese Yuan</option>
              <option value="KRW" className="bg-[#202020] text-white">KRW - South Korean Won</option>
              <option value="ILS" className="bg-[#202020] text-white">ILS - Israeli Shekel</option>
              <option value="MYR" className="bg-[#202020] text-white">MYR - Malaysian Ringgit</option>
              <option value="TWD" className="bg-[#202020] text-white">TWD - Taiwan Dollar</option>
              <option value="PHP" className="bg-[#202020] text-white">PHP - Philippine Peso</option>
              <option value="THB" className="bg-[#202020] text-white">THB - Thai Baht</option>
            </select>
          </SettingsRow>

          <SettingsRow icon={<Clock />} label="Timezone" description="Global timezone for logs and timestamps." displayValue={formData.localization?.timezone || 'UTC'} onSave={() => saveSection({ localization: formData.localization }, 'Localization settings updated.')}>
            <select
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              value={formData.localization?.timezone || 'UTC'}
              onChange={(e) => updateFormData('localization.timezone', e.target.value)}
              disabled={loading}
            >
              <option value="UTC" className="bg-[#202020] text-white">UTC</option>
              <option value="America/New_York" className="bg-[#202020] text-white">Eastern Time (ET)</option>
              <option value="America/Chicago" className="bg-[#202020] text-white">Central Time (CT)</option>
              <option value="America/Denver" className="bg-[#202020] text-white">Mountain Time (MT)</option>
              <option value="America/Los_Angeles" className="bg-[#202020] text-white">Pacific Time (PT)</option>
              <option value="Europe/London" className="bg-[#202020] text-white">London</option>
              <option value="Europe/Paris" className="bg-[#202020] text-white">Paris</option>
              <option value="Asia/Tokyo" className="bg-[#202020] text-white">Tokyo</option>
              <option value="Asia/Shanghai" className="bg-[#202020] text-white">Shanghai</option>
              <option value="Australia/Sydney" className="bg-[#202020] text-white">Sydney</option>
            </select>
          </SettingsRow>
        </div>

      </section>
      </div>
      )}

      {activeTab === 'referrals' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* Referral Settings */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Referral Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure coin rewards for invites</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <SettingsRow icon={<Gift />} label="Coins to Referrer" description="Amount of coins given to the person who invited someone." displayValue={formData.referrals?.referrerCoins} onSave={() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')}>
            <input
              type="number"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder="50"
              value={Number(formData.referrals?.referrerCoins ?? 0)}
              onChange={(e) => updateFormData('referrals.referrerCoins', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </SettingsRow>
          <SettingsRow icon={<Gift />} label="Coins to Referred User" description="Amount of coins given to the new user who joined using an invite." displayValue={formData.referrals?.referredCoins} onSave={() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')}>
            <input
              type="number"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder="25"
              value={Number(formData.referrals?.referredCoins ?? 0)}
              onChange={(e) => updateFormData('referrals.referredCoins', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </SettingsRow>
          <SettingsRow icon={<Users />} label="Min Invites for Custom Code" description="Minimum number of invites required to set a custom referral code." displayValue={formData.referrals?.customCodeMinInvites} onSave={() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')}>
            <input
              type="number"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder="10"
              value={Number(formData.referrals?.customCodeMinInvites ?? 10)}
              onChange={(e) => updateFormData('referrals.customCodeMinInvites', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </SettingsRow>
        </div>

      </section>
      </div>
      )}

      {activeTab === 'auth' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* Authentication Settings */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Authentication Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure login methods and OAuth options</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {/* Email Login Toggle */}
          <SettingsRow icon={<Mail />} label="Enable Email Login" description="Allow users to register and login with email and password" displayValue={(formData.auth?.emailLogin ?? true) ? 'Enabled' : 'Disabled'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
            <label className="relative inline-flex items-center cursor-pointer justify-end w-full max-w-md">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.auth?.emailLogin ?? true}
                onChange={(e) => updateFormData('auth.emailLogin', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
          </SettingsRow>
  
          {/* Discord OAuth */}
          <SettingsRow icon={<Fingerprint />} label="Enable Discord Login" description="Allow users to login using their Discord account" displayValue={formData.auth?.discord?.enabled ? 'Enabled' : 'Disabled'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
            <label className="relative inline-flex items-center cursor-pointer justify-end w-full max-w-md">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.auth?.discord?.enabled || false}
                onChange={(e) => updateFormData('auth.discord.enabled', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
          </SettingsRow>

          {formData.auth?.discord?.enabled && (
            <>
              <SettingsRow icon={<Key />} label="Discord Client ID" description="The Client ID from your Discord Developer Portal." displayValue={formData.auth?.discord?.clientId || 'Not set'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
                <input
                  type="text"
                  className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                  placeholder="Enter Discord Client ID"
                  value={formData.auth?.discord?.clientId || ''}
                  onChange={(e) => updateFormData('auth.discord.clientId', e.target.value)}
                  disabled={loading}
                />
              </SettingsRow>
              <SettingsRow icon={<Key />} label="Discord Client Secret" description="The Client Secret from your Discord Developer Portal." displayValue={formData.auth?.discord?.clientSecret ? '********' : 'Not set'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
                <input
                  type="password"
                  className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                  placeholder="Enter Discord Client Secret"
                  value={formData.auth?.discord?.clientSecret || ''}
                  onChange={(e) => updateFormData('auth.discord.clientSecret', e.target.value)}
                  disabled={loading}
                />
              </SettingsRow>
              
              {/* Discord Auto-Join Toggle */}
              <SettingsRow icon={<ShieldAlert />} label="Enable Auto-Join Discord Server" description="Automatically add users to your Discord server when they login with Discord" displayValue={formData.auth?.discord?.autoJoin ? 'Enabled' : 'Disabled'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
                <label className="relative inline-flex items-center cursor-pointer justify-end w-full max-w-md">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.auth?.discord?.autoJoin || false}
                    onChange={(e) => updateFormData('auth.discord.autoJoin', e.target.checked)}
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                </label>
              </SettingsRow>

              {formData.auth?.discord?.autoJoin && (
                <>
                  <SettingsRow icon={<MessageSquare />} label="Discord Guild ID" description="The Server (Guild) ID users should join." displayValue={formData.auth?.discord?.guildId || 'Not set'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
                    <input
                      type="text"
                      className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                      placeholder="Enter Discord Guild (Server) ID"
                      value={formData.auth?.discord?.guildId || ''}
                      onChange={(e) => updateFormData('auth.discord.guildId', e.target.value)}
                      disabled={loading}
                    />
                  </SettingsRow>
                  <SettingsRow icon={<Bot />} label="Discord Bot Token" description="Bot token used to add the user to the server." displayValue={formData.auth?.discord?.botToken ? '********' : 'Not set'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
                    <input
                      type="password"
                      className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                      placeholder="Enter Discord Bot Token"
                      value={formData.auth?.discord?.botToken || ''}
                      onChange={(e) => updateFormData('auth.discord.botToken', e.target.value)}
                      disabled={loading}
                    />
                  </SettingsRow>
                </>
              )}
              
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <i className="fab fa-discord text-white mt-1"></i>
                  <div className="text-sm text-[#AAAAAA]">
                    <p className="font-medium text-white mb-2">Discord Setup Instructions:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline">discord.com/developers/applications</a></li>
                      <li>Create a new application or select existing one</li>
                      <li>Go to OAuth2 → General</li>
                      <li>Add this redirect URI: <code className="bg-[#181818] px-2 py-1 rounded text-gray-300">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/discord/callback</code></li>
                      <li>Copy Client ID and Client Secret to the fields above</li>
                      <li><strong>For Auto-Join:</strong> Go to Bot → Create Bot → Copy Bot Token</li>
                      <li><strong>For Auto-Join:</strong> Enable "SERVER MEMBERS INTENT" in Bot settings</li>
                      <li><strong>For Auto-Join:</strong> Invite bot to your server with "Manage Server" permission</li>
                      <li><strong>For Auto-Join:</strong> Get your server ID (right-click server → Copy Server ID)</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}

        {/* Google OAuth */}
        <SettingsRow icon={<Fingerprint />} label="Enable Google Login" description="Allow users to login using their Google account" displayValue={formData.auth?.google?.enabled ? 'Enabled' : 'Disabled'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
          <label className="relative inline-flex items-center cursor-pointer justify-end w-full max-w-md">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.auth?.google?.enabled || false}
              onChange={(e) => updateFormData('auth.google.enabled', e.target.checked)}
              disabled={loading}
            />
            <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
          </label>
        </SettingsRow>

        {formData.auth?.google?.enabled && (
          <>
            <SettingsRow icon={<Key />} label="Google Client ID" description="The Client ID from your Google Cloud Console." displayValue={formData.auth?.google?.clientId || 'Not set'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
              <input
                type="text"
                className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                placeholder="Enter Google Client ID"
                value={formData.auth?.google?.clientId || ''}
                onChange={(e) => updateFormData('auth.google.clientId', e.target.value)}
                disabled={loading}
              />
            </SettingsRow>
            <SettingsRow icon={<Key />} label="Google Client Secret" description="The Client Secret from your Google Cloud Console." displayValue={formData.auth?.google?.clientSecret ? '********' : 'Not set'} onSave={() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')}>
              <input
                type="password"
                className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                placeholder="Enter Google Client Secret"
                value={formData.auth?.google?.clientSecret || ''}
                onChange={(e) => updateFormData('auth.google.clientSecret', e.target.value)}
                disabled={loading}
              />
            </SettingsRow>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <i className="fab fa-google text-white mt-1"></i>
                <div className="text-sm text-[#AAAAAA]">
                  <p className="font-medium text-white mb-2">Google Setup Instructions:</p>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline">Google Cloud Console</a></li>
                    <li>Create a new project or select existing one</li>
                    <li>Configure OAuth consent screen (Internal/External)</li>
                    <li>Go to Credentials → Create Credentials → OAuth client ID</li>
                    <li>Application type: Web application</li>
                    <li>Authorized redirect URIs: <code className="bg-[#181818] px-2 py-1 rounded text-gray-300">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/google/callback</code></li>
                    <li>Copy Client ID and Client Secret to the fields above</li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        )}
        </div>
      </section>
      </div>
      )}

      {activeTab === 'resources' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* Default Resources */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Default Resources</h3>
            <p className="mt-2 text-sm text-white/35">Set default resource allocations for new users</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {([
            ['cpuPercent', 'CPU (%)', 'Percentage of CPU allocated'],
            ['memoryMb', 'Memory (MB)', 'RAM in megabytes'],
            ['diskMb', 'Disk (MB)', 'Storage in megabytes'],
            ['serverSlots', 'Server Slots', 'Number of servers allowed'],
            ['backups', 'Backups', 'Number of backups allowed'],
            ['allocations', 'Allocations', 'Number of port allocations'],
            ['databases', 'Databases', 'Number of databases allowed'],
            ['coins', 'Coins', 'Starting coin balance']
          ] as [keyof Settings['defaults'], string, string][]).map(([key, label, tooltip]) => (
            <SettingsRow key={key} icon={key === "cpu" ? <Cpu /> : key === "ram" ? <HardDrive /> : key === "disk" ? <Database /> : <Network />} label={label} description={tooltip} displayValue={formData.defaults?.[key]} onSave={() => saveSection({ defaults: formData.defaults }, 'Default resources updated.')}>
              <input
                type="number"
                min="0"
                className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                value={formData.defaults?.[key] || 0}
                onChange={(e) => updateFormData(`defaults.${key}`, Number(e.target.value))}
                disabled={loading}
              />
            </SettingsRow>
          ))}
        </div>

      </section>
      </div>
      )}

      {activeTab === 'adsense' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* AdSense Settings */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Google AdSense Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure Google AdSense integration and ad slots</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {/* Enable/Disable Toggle */}
          <SettingsRow icon={<BadgeDollarSign />} label="Enable Google AdSense" description="Toggle to enable Google AdSense ads on your site" displayValue={formData.adsense?.enabled ? 'Enabled' : 'Disabled'} onSave={() => saveSection({ adsense: formData.adsense }, 'AdSense settings updated.')}>
            <label className="relative inline-flex items-center cursor-pointer justify-end w-full max-w-md">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.adsense?.enabled || false}
                onChange={(e) => updateFormData('adsense.enabled', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
          </SettingsRow>

          {formData.adsense?.enabled && (
            <>
              {/* Publisher ID */}
              <SettingsRow icon={<BadgeDollarSign />} label="Publisher ID" description="Your Google AdSense Publisher ID (starts with ca-pub-)" displayValue={formData.adsense?.publisherId || 'Not set'} onSave={() => saveSection({ adsense: formData.adsense }, 'AdSense settings updated.')}>
                <input
                  type="text"
                  className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                  placeholder="ca-pub-1234567890123456"
                  value={formData.adsense?.publisherId || ''}
                  onChange={(e) => updateFormData('adsense.publisherId', e.target.value)}
                  disabled={loading}
                />
              </SettingsRow>

              {/* Ad Slots */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Ad Slots</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    ['header', 'Header Ad Slot'],
                    ['sidebar', 'Sidebar Ad Slot'],
                    ['footer', 'Footer Ad Slot'],
                    ['content', 'Content Ad Slot'],
                    ['mobile', 'Mobile Ad Slot']
                  ] as const).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-[#D4D4D4]">{label}</label>
                      <input
                        type="text"
                        className="h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                        placeholder={`${key} ad slot ID`}
                        value={formData.adsense?.adSlots?.[key] || ''}
                        onChange={(e) => updateFormData(`adsense.adSlots.${key}`, e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ad Types */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Ad Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {([
                    ['display', 'Display Ads'],
                    ['text', 'Text Ads'],
                    ['link', 'Link Ads'],
                    ['inFeed', 'In-Feed Ads'],
                    ['inArticle', 'In-Article Ads'],
                    ['matchedContent', 'Matched Content']
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.adsense?.adTypes?.[key] || false}
                          onChange={(e) => updateFormData(`adsense.adTypes.${key}`, e.target.checked)}
                          disabled={loading}
                        />
                        <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                      </label>
                      <span className="text-[#D4D4D4] text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fab fa-google text-white mt-1"></i>
                  <div className="text-sm text-[#AAAAAA]">
                    <p className="font-medium text-white mb-2">AdSense Setup Instructions:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline">Google AdSense</a></li>
                      <li>Sign up or sign in to your AdSense account</li>
                      <li>Add your website and get approved</li>
                      <li>Go to Ads → By ad unit → Display ads</li>
                      <li>Create ad units for different positions (header, sidebar, footer, content, mobile)</li>
                      <li>Copy the ad unit codes and paste them in the fields above</li>
                      <li>Your Publisher ID can be found in the AdSense dashboard</li>
                      <li><strong>Note:</strong> Ads will automatically appear on all pages when enabled</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </section>
      </div>
      )}

      {activeTab === 'paypal' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* PayPal Settings */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">PayPal Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure PayPal integration for payments</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {/* Enable/Disable Toggle */}
          <SettingsRow icon={<CreditCard />} label="Enable PayPal Payments" description="Toggle to enable PayPal Payments for all users" displayValue={formData.payments?.paypal?.enabled ? 'Enabled' : 'Disabled'} onSave={() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')}>
            <label className="relative inline-flex items-center cursor-pointer justify-end w-full max-w-md">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.payments?.paypal?.enabled || false}
                onChange={(e) => updateFormData('payments.paypal.enabled', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
          </SettingsRow>

          {formData.payments?.paypal?.enabled && (
            <>
              <SettingsRow icon={<Activity />} label="Mode" description="Select the environment for PayPal transactions" displayValue={formData.payments?.paypal?.mode === 'live' ? 'Live' : 'Sandbox'} onSave={() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')}>
                <select
                  className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                  value={formData.payments?.paypal?.mode || 'sandbox'}
                  onChange={(e) => updateFormData('payments.paypal.mode', e.target.value)}
                  disabled={loading}
                >
                  <option value="sandbox" className="bg-[#202020] text-white">Sandbox (Testing)</option>
                  <option value="live" className="bg-[#202020] text-white">Live (Production)</option>
                </select>
              </SettingsRow>

              <SettingsRow icon={<Key />} label="Client ID" description="Your PayPal Client ID" displayValue={formData.payments?.paypal?.clientId || 'Not set'} onSave={() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')}>
                <input
                  type="text"
                  className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                  placeholder="Enter PayPal Client ID"
                  value={formData.payments?.paypal?.clientId || ''}
                  onChange={(e) => updateFormData('payments.paypal.clientId', e.target.value)}
                  disabled={loading}
                />
              </SettingsRow>
              
              <SettingsRow icon={<Key />} label="Client Secret" description="Your PayPal Client Secret" displayValue={formData.payments?.paypal?.clientSecret ? '********' : 'Not set'} onSave={() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')}>
                <input
                  type="password"
                  className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                  placeholder="Enter PayPal Client Secret"
                  value={formData.payments?.paypal?.clientSecret || ''}
                  onChange={(e) => updateFormData('payments.paypal.clientSecret', e.target.value)}
                  disabled={loading}
                />
              </SettingsRow>
              
              <SettingsRow icon={<LinkIcon />} label="Webhook ID" description={<>Configure your PayPal Webhook to POST to <code className="bg-[#202020] px-2 py-1 rounded text-blue-400">{process.env.NEXT_PUBLIC_API_BASE}/api/paypal/webhook</code> and paste the Webhook ID here.</>} displayValue={formData.payments?.paypal?.webhookId || 'Not set'} onSave={() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')}>
                <input
                  type="text"
                  className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                  placeholder="Enter PayPal Webhook ID"
                  value={formData.payments?.paypal?.webhookId || ''}
                  onChange={(e) => updateFormData('payments.paypal.webhookId', e.target.value)}
                  disabled={loading}
                />
              </SettingsRow>
            </>
          )}

          <div className="pt-5">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-blue-400 mt-1"></i>
                <div className="text-sm text-[#AAAAAA]">
                  <p className="font-medium text-white mb-1">Important Notes:</p>
                  <ul className="space-y-1">
                    <li>• Use sandbox credentials for testing, live credentials for production</li>
                    <li>• Return/cancel URLs are fixed at <code className="bg-[#181818] px-2 py-1 rounded">/plan/success</code> and <code className="bg-[#181818] px-2 py-1 rounded">/plan/cancel</code></li>
                    <li>• Ensure your PayPal app has the necessary permissions enabled</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
      </div>
      )}

      {activeTab === 'updates' && (
      <div className="space-y-6 animate-in fade-in duration-200">
      {/* System Updates */}
      <UpdateSystem />
      </div>
      )}


    </div>
    </div>
  );
}
