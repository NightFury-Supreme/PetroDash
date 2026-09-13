import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { useModal } from '@/components/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { UpdateSystem } from '../updates';
import { Palette, Globe, ShieldCheck, Server, Users, RefreshCw, Upload, Trash2, LayoutTemplate, Image as ImageIcon, Coins, Clock, Gift, Mail, Database, HardDrive, Cpu, Network, ChevronDown, Loader2, Archive, MemoryStick } from 'lucide-react';

const PayPalIcon = ({ size }: { size?: number }) => <i className="fab fa-paypal" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;
const GoogleIcon = ({ size }: { size?: number }) => <i className="fab fa-google" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;

function SideItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2.5
        py-2
        text-left
        text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-1
        focus-visible:ring-white/30

        ${
          active
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

function SettingsDropdown({
  value,
  options,
  onChange,
  disabled
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (optValue: string) => {
    setOpen(false);
    setLoading(true);
    try {
      await onChange(optValue);
    } finally {
      setLoading(false);
    }
  };

  const activeLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <button
        onClick={() => !disabled && !loading && setOpen(!open)}
        disabled={disabled || loading}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg bg-[#1A1A1A] px-3 text-sm text-[#999] transition-colors hover:bg-[#222] hover:text-[#ddd] disabled:opacity-50"
      >
        <span className="truncate">{activeLabel}</span>
        {loading ? (
          <Loader2 size={14} className="animate-spin opacity-50 shrink-0" />
        ) : (
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-10 z-50 rounded-lg border border-[#222] bg-[#151515] p-1 shadow-xl max-h-[200px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`flex h-8 w-full items-center rounded px-2 text-left text-sm transition-colors ${
                opt.value === value
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Settings {
  siteName: string;
  siteIcon: string; // Changed from siteIconUrl to siteIcon
  payments: {
    smtp: {
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
      <div className={`grid grid-cols-1 gap-4 ${displayValue === undefined ? 'md:grid-cols-[minmax(250px,1fr)_1fr]' : 'md:grid-cols-[minmax(250px,1fr)_1fr_150px]'} md:items-start`}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
              {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
            <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
          </div>
        </div>
        <div className={`flex flex-col w-full justify-center ${displayValue === undefined ? 'md:items-end' : ''}`}>
          {isEditing ? children : (displayValue !== undefined ? (
            <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9">
              {displayValue === 'Enabled' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
              ) : displayValue === 'Disabled' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
              ) : (
                displayValue
              )}
            </div>
          ) : children)}
        </div>
        {displayValue !== undefined && (
          <div className="flex items-center justify-end gap-2">
            {!isEditing && (
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
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><i className="fas fa-save text-[14px]"></i> Save</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsDrawerRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  onSave,
  children
}: {
  icon?: React.ReactNode,
  label: string,
  description: React.ReactNode,
  enabled?: boolean,
  onToggle?: (enabled: boolean) => Promise<void>,
  onSave: () => Promise<void>,
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-start`}>
         <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
              {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
            </div>
          )}
           <div>
             <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
             <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
           </div>
         </div>
         <div className="flex flex-col w-full justify-center">
            <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9">
              {enabled !== undefined && (
                enabled ? (
                   <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
                ) : (
                   <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
                )
              )}
            </div>
         </div>
         <div className="flex items-center justify-end gap-2">
            <button onClick={() => setIsOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition">
              <i className="fas fa-pencil-alt text-[10px]"></i> Edit
            </button>
         </div>
      </div>
      
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Configure ${label}`}
        subtitle={typeof description === 'string' ? description : "Update this setting"}
        icon={icon}
        footer={
          <div className="flex items-center justify-between w-full">
            {enabled !== undefined && onToggle ? (
              enabled ? (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => { setIsSaving(true); await onToggle(false); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium transition-all border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50" disabled={isSaving}>
                       {isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14}/> Disable</>}
                    </button>
                  </div>
                  <button onClick={async () => { setIsSaving(true); await onSave(); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={async () => { setIsSaving(true); await onToggle(true); setIsSaving(false); setIsOpen(false); }} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Enable Integration'}
                </button>
              )
            ) : (
              <div className="flex items-center justify-end w-full">
                <button onClick={async () => { setIsSaving(true); await onSave(); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        }
      >
        {children ? (
          <div className="space-y-5 px-1 py-2">
             {children}
          </div>
        ) : (
          <div className="py-10 text-center flex flex-col items-center">
             <div className="h-12 w-12 rounded-full bg-[#1A1A1A] border border-[#222] flex items-center justify-center text-[#555] mb-4">
                {icon}
             </div>
             <p className="text-[#888] text-sm max-w-[250px] mx-auto">This setting requires no additional configuration. Simply enable or disable it below.</p>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function SiteIconDisplay({ src }: { src: string }) {
  const [error, setError] = React.useState(false);
  
  if (error || !src) return <ImageIcon size={16} />;
  return <img src={src} alt="Icon" className="w-6 h-6 rounded" onError={() => setError(true)} />;
}

const TIMEZONE_OPTIONS = (() => {
  try {
    const d = new Date();
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    
    for (const tz of Intl.supportedValuesOf('timeZone')) {
      try {
        const offsetRaw = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
          .formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
        const longGeneric = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longGeneric' })
          .formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
          
        if (offsetRaw && longGeneric) {
          let formattedOffset = 'UTC+00:00';
          if (offsetRaw !== 'GMT') {
            const p = offsetRaw.replace('GMT', '').split(':');
            const sign = p[0][0];
            let hr = p[0].substring(1);
            if (hr.length === 1) hr = '0' + hr;
            const min = p[1] || '00';
            formattedOffset = `UTC${sign}${hr}:${min}`;
          }
          
          const label = `(${formattedOffset}) ${longGeneric}`;
          if (!seen.has(label)) {
            seen.add(label);
            options.push({ value: tz, label });
          }
        }
      } catch (e) {
        // Skip invalid tz
      }
    }
    
    // Sort by UTC offset mathematically
    options.sort((a, b) => {
      const getMin = (label: string) => {
        const match = label.match(/UTC([+-])(\d{2}):(\d{2})/);
        if (!match) return 0;
        const mins = parseInt(match[2]) * 60 + parseInt(match[3]);
        return match[1] === '-' ? -mins : mins;
      };
      return getMin(a.label) - getMin(b.label);
    });
    
    return options.length > 0 ? options : [{ value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' }];
  } catch (e) {
    return [{ value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' }];
  }
})();

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
          <SettingsRow icon={<Coins />} label="Site Currency" description="This currency is displayed on the shop and all plans." onSave={() => saveSection({ localization: formData.localization }, 'Localization settings updated.')}>
            <SettingsDropdown
              value={formData.localization?.currency || 'USD'}
              onChange={async (val) => {
                updateFormData('localization.currency', val);
                await saveSection({ localization: { ...formData.localization, currency: val } }, 'Localization settings updated.');
              }}
              disabled={loading}
              options={[
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'EUR', label: 'EUR - Euro' },
                { value: 'GBP', label: 'GBP - British Pound' },
                { value: 'INR', label: 'INR - Indian Rupee' },
                { value: 'CAD', label: 'CAD - Canadian Dollar' },
                { value: 'AUD', label: 'AUD - Australian Dollar' },
                { value: 'JPY', label: 'JPY - Japanese Yen' },
                { value: 'CHF', label: 'CHF - Swiss Franc' },
                { value: 'NZD', label: 'NZD - New Zealand Dollar' },
                { value: 'SEK', label: 'SEK - Swedish Krona' },
                { value: 'DKK', label: 'DKK - Danish Krone' },
                { value: 'NOK', label: 'NOK - Norwegian Krone' },
                { value: 'PLN', label: 'PLN - Polish Złoty' },
                { value: 'CZK', label: 'CZK - Czech Koruna' },
                { value: 'HUF', label: 'HUF - Hungarian Forint' },
                { value: 'BRL', label: 'BRL - Brazilian Real' },
                { value: 'MXN', label: 'MXN - Mexican Peso' },
                { value: 'SGD', label: 'SGD - Singapore Dollar' },
                { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
                { value: 'CNY', label: 'CNY - Chinese Yuan' },
                { value: 'KRW', label: 'KRW - South Korean Won' },
                { value: 'ILS', label: 'ILS - Israeli Shekel' },
                { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
                { value: 'TWD', label: 'TWD - Taiwan Dollar' },
                { value: 'PHP', label: 'PHP - Philippine Peso' },
                { value: 'THB', label: 'THB - Thai Baht' }
              ]}
            />
          </SettingsRow>

          <SettingsRow icon={<Clock />} label="Timezone" description="Global timezone for logs and timestamps." onSave={() => saveSection({ localization: formData.localization }, 'Localization settings updated.')}>
            <SettingsDropdown
              value={formData.localization?.timezone || 'UTC'}
              onChange={async (val) => {
                updateFormData('localization.timezone', val);
                await saveSection({ localization: { ...formData.localization, timezone: val } }, 'Localization settings updated.');
              }}
              disabled={loading}
              options={TIMEZONE_OPTIONS}
            />
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
          {/* Email Login */}
          <SettingsDrawerRow 
            icon={<Mail />} 
            label="Email Login" 
            description="Allow users to register and login with email and password" 
            enabled={formData.auth?.emailLogin ?? true} 
            onToggle={async (enabled) => { updateFormData('auth.emailLogin', enabled); await saveSection({ auth: { ...formData.auth, emailLogin: enabled } as any }, `Email login ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, 'Email login settings updated.')}
          >
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">Enable Email Verification</span>
                   <span className="text-xs text-[#888]">Require users to verify their email before accessing the dashboard.</span>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={formData.auth?.emailVerification || false} onChange={(e) => updateFormData('auth.emailVerification', e.target.checked)} disabled={loading} />
                   <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                 </label>
               </div>
             </div>
          </SettingsDrawerRow>

  
          {/* Discord Login */}
          <SettingsDrawerRow 
            icon={<i className="fab fa-discord"></i>} 
            label="Discord Login" 
            description="Allow users to login using their Discord account" 
            enabled={formData.auth?.discord?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('auth.discord.enabled', enabled); await saveSection({ auth: { ...formData.auth, discord: { ...formData.auth?.discord, enabled } } as any }, `Discord login ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, 'Authentication settings updated.')}
          >
             <div className="space-y-5">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Client ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Discord Client ID" value={formData.auth?.discord?.clientId || ''} onChange={(e) => updateFormData('auth.discord.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Client Secret</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Discord Client Secret" value={formData.auth?.discord?.clientSecret || ''} onChange={(e) => updateFormData('auth.discord.clientSecret', e.target.value)} disabled={loading} />
               </div>
               
               <div className="pt-3 border-t border-white/[0.06]">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex flex-col">
                     <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">Auto-Join Discord Server</span>
                     <span className="text-xs text-[#888]">Automatically add users to your Discord server when they login</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={formData.auth?.discord?.autoJoin || false} onChange={(e) => updateFormData('auth.discord.autoJoin', e.target.checked)} disabled={loading} />
                     <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                   </label>
                 </div>
                 
                 {formData.auth?.discord?.autoJoin && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <div>
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Guild ID</label>
                       <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Discord Guild (Server) ID" value={formData.auth?.discord?.guildId || ''} onChange={(e) => updateFormData('auth.discord.guildId', e.target.value)} disabled={loading} />
                     </div>
                     <div>
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Bot Token</label>
                       <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Discord Bot Token" value={formData.auth?.discord?.botToken || ''} onChange={(e) => updateFormData('auth.discord.botToken', e.target.value)} disabled={loading} />
                     </div>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white">
                     <i className="fab fa-discord text-lg"></i>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Setup Instructions</h4>
                </div>
                <ol className="space-y-2 list-decimal list-inside text-xs text-[#888]">
                  <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">discord.com/developers/applications</a></li>
                  <li>Create a new application or select an existing one</li>
                  <li>Go to <strong>OAuth2</strong> → <strong>General</strong></li>
                  <li>Add this redirect URI: <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/discord/callback</code></li>
                  <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong> to the fields above</li>
                  <li><strong>For Auto-Join:</strong> Go to <strong>Bot</strong> → <strong>Create Bot</strong> → Copy <strong>Bot Token</strong></li>
                  <li><strong>For Auto-Join:</strong> Enable <strong>SERVER MEMBERS INTENT</strong> in Bot settings</li>
                  <li><strong>For Auto-Join:</strong> Invite bot to your server with <strong>Manage Server</strong> permission</li>
                  <li><strong>For Auto-Join:</strong> Get your server ID (right-click server → Copy Server ID)</li>
                </ol>
             </div>
          </SettingsDrawerRow>

          {/* Google Login */}
          <SettingsDrawerRow 
            icon={<i className="fab fa-google"></i>} 
            label="Google Login" 
            description="Allow users to login using their Google account" 
            enabled={formData.auth?.google?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('auth.google.enabled', enabled); await saveSection({ auth: { ...formData.auth, google: { ...formData.auth?.google, enabled } } as any }, `Google login ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, 'Authentication settings updated.')}
          >
             <div className="space-y-4">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Google Client ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Google Client ID" value={formData.auth?.google?.clientId || ''} onChange={(e) => updateFormData('auth.google.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Google Client Secret</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Google Client Secret" value={formData.auth?.google?.clientSecret || ''} onChange={(e) => updateFormData('auth.google.clientSecret', e.target.value)} disabled={loading} />
               </div>
             </div>
             
             <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white">
                     <i className="fab fa-google text-lg"></i>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Setup Instructions</h4>
                </div>
                <ol className="space-y-2 list-decimal list-inside text-xs text-[#888]">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Google Cloud Console</a></li>
                  <li>Create a new project or select an existing one</li>
                  <li>Configure <strong>OAuth consent screen</strong> (Internal/External)</li>
                  <li>Go to <strong>Credentials</strong> → <strong>Create Credentials</strong> → <strong>OAuth client ID</strong></li>
                  <li>Application type: <strong>Web application</strong></li>
                  <li>Authorized redirect URIs: <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/google/callback</code></li>
                  <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong> to the fields above</li>
                </ol>
             </div>
          </SettingsDrawerRow>
        </div>
      </section>
      </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-6 animate-in fade-in duration-200">
        {/* Email Settings */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-white">Email Settings</h3>
              <p className="mt-2 text-sm text-white/35">Configure SMTP and email verification</p>
            </div>
          </div>
          
          <div className="divide-y divide-white/[0.06]">
            {/* Email Configuration */}
            <SettingsDrawerRow 
              icon={<Mail />} 
              label="Email Configuration" 
              description="Configure your email server settings for outgoing emails." 
              enabled={formData.payments?.smtp?.enabled ?? false}
              onToggle={async (enabled) => { updateFormData('payments.smtp.enabled', enabled); await saveSection({ payments: { smtp: { ...formData.payments?.smtp, enabled } } as any }, `Email Configuration ${enabled ? 'enabled' : 'disabled'}`); }}
              onSave={async () => await saveSection({ payments: { smtp: formData.payments?.smtp } as any }, 'SMTP settings updated.')}
            >
               <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex flex-col">
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Host</label>
                       <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="smtp.example.com" value={formData.payments?.smtp?.host || ''} onChange={(e) => updateFormData('payments.smtp.host', e.target.value)} disabled={loading} />
                     </div>
                     <div className="flex flex-col">
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Port</label>
                       <input type="number" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="587" value={formData.payments?.smtp?.port || ''} onChange={(e) => updateFormData('payments.smtp.port', parseInt(e.target.value) || '')} disabled={loading} />
                     </div>
                     <div className="flex flex-col">
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Username</label>
                       <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="user@example.com" value={formData.payments?.smtp?.user || ''} onChange={(e) => updateFormData('payments.smtp.user', e.target.value)} disabled={loading} />
                     </div>
                     <div className="flex flex-col">
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Password</label>
                       <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="••••••••" value={formData.payments?.smtp?.pass || ''} onChange={(e) => updateFormData('payments.smtp.pass', e.target.value)} disabled={loading} />
                     </div>
                     <div className="flex flex-col md:col-span-2">
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">From Email Address</label>
                       <input type="email" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="noreply@example.com" value={formData.payments?.smtp?.fromEmail || ''} onChange={(e) => updateFormData('payments.smtp.fromEmail', e.target.value)} disabled={loading} />
                       <p className="mt-2 text-[11px] text-[#555]">This email address will be used as the sender for all outgoing emails.</p>
                     </div>
                   </div>
                   
                   <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                     <div className="flex flex-col">
                       <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">Enable TLS/SSL</span>
                       <span className="text-xs text-[#888]">Use a secure connection</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={formData.payments?.smtp?.secure || false} onChange={(e) => updateFormData('payments.smtp.secure', e.target.checked)} disabled={loading} />
                       <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                     </label>
                   </div>
               </div>
            </SettingsDrawerRow>
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
              <SettingsRow 
                key={key} 
                icon={
                  key === 'cpuPercent' ? <Cpu /> : 
                  key === 'memoryMb' ? <MemoryStick /> : 
                  key === 'diskMb' ? <HardDrive /> : 
                  key === 'serverSlots' ? <Server /> : 
                  key === 'backups' ? <Archive /> : 
                  key === 'allocations' ? <Network /> : 
                  key === 'databases' ? <Database /> : 
                  key === 'coins' ? <Coins /> : 
                  <Server />
                } 
                label={label} 
                description={tooltip} 
                displayValue={formData.defaults?.[key]} 
                onSave={() => saveSection({ defaults: formData.defaults }, 'Default resources updated.')}
              >
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
          {/* AdSense Settings */}
          <SettingsDrawerRow 
            icon={<i className="fab fa-google"></i>} 
            label="Google AdSense" 
            description="Configure Google AdSense integration and ad slots" 
            enabled={formData.adsense?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('adsense.enabled', enabled); await saveSection({ adsense: { ...formData.adsense, enabled } as any }, `AdSense ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ adsense: formData.adsense }, 'AdSense settings updated.')}
          >
             <div className="space-y-6">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Publisher ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="ca-pub-1234567890123456" value={formData.adsense?.publisherId || ''} onChange={(e) => updateFormData('adsense.publisherId', e.target.value)} disabled={loading} />
                 <p className="mt-1 text-[11px] text-[#555]">Your Google AdSense Publisher ID (starts with ca-pub-)</p>
               </div>
               
               <div>
                 <h4 className="mb-3 block text-sm font-medium text-[#D4D4D4]">Ad Slots</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {([
                     ['header', 'Header Ad Slot'],
                     ['sidebar', 'Sidebar Ad Slot'],
                     ['footer', 'Footer Ad Slot'],
                     ['content', 'Content Ad Slot'],
                     ['mobile', 'Mobile Ad Slot']
                   ] as const).map(([key, label]) => (
                     <div key={key} className="space-y-1.5">
                       <label className="block text-xs font-medium text-[#D4D4D4]">{label}</label>
                       <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={`${key} ad slot ID`} value={formData.adsense?.adSlots?.[key] || ''} onChange={(e) => updateFormData(`adsense.adSlots.${key}`, e.target.value)} disabled={loading} />
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <h4 className="mb-3 block text-sm font-medium text-[#D4D4D4]">Ad Types</h4>
                 <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
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
                         <input type="checkbox" className="sr-only peer" checked={formData.adsense?.adTypes?.[key] || false} onChange={(e) => updateFormData(`adsense.adTypes.${key}`, e.target.checked)} disabled={loading} />
                         <div className="w-9 h-5 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                       </label>
                       <span className="text-[#D4D4D4] text-xs font-medium">{label}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
             
             <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white">
                     <i className="fab fa-google text-lg"></i>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Setup Instructions</h4>
                </div>
                <ol className="space-y-2 list-decimal list-inside text-xs text-[#888]">
                  <li>Go to <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Google AdSense</a></li>
                  <li>Sign up or sign in to your AdSense account</li>
                  <li>Add your website and get approved</li>
                  <li>Go to <strong>Ads</strong> → <strong>By ad unit</strong> → <strong>Display ads</strong></li>
                  <li>Create ad units for different positions (header, sidebar, footer, content, mobile)</li>
                  <li>Copy the ad unit codes and paste them in the fields above</li>
                  <li>Your <strong>Publisher ID</strong> can be found in the AdSense dashboard</li>
                  <li><strong>Note:</strong> Ads will automatically appear on all pages when enabled</li>
                </ol>
             </div>
          </SettingsDrawerRow>
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
          {/* PayPal Settings */}
          <SettingsDrawerRow 
            icon={<i className="fab fa-paypal"></i>} 
            label="PayPal Payments" 
            description="Configure PayPal integration for payments" 
            enabled={formData.payments?.paypal?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('payments.paypal.enabled', enabled); await saveSection({ payments: { ...formData.payments, paypal: { ...formData.payments?.paypal, enabled } as any } }, `PayPal payments ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')}
          >
             <div className="space-y-4">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Environment Mode</label>
                 <SettingsDropdown
                   value={formData.payments?.paypal?.mode || 'sandbox'}
                   onChange={async (val) => updateFormData('payments.paypal.mode', val)}
                   disabled={loading}
                   options={[
                     { value: 'sandbox', label: 'Sandbox (Testing)' },
                     { value: 'live', label: 'Live (Production)' }
                   ]}
                 />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Client ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter PayPal Client ID" value={formData.payments?.paypal?.clientId || ''} onChange={(e) => updateFormData('payments.paypal.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Client Secret</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter PayPal Client Secret" value={formData.payments?.paypal?.clientSecret || ''} onChange={(e) => updateFormData('payments.paypal.clientSecret', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Webhook ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter PayPal Webhook ID" value={formData.payments?.paypal?.webhookId || ''} onChange={(e) => updateFormData('payments.paypal.webhookId', e.target.value)} disabled={loading} />
                 <p className="mt-2 text-[11px] text-[#555]">Configure your PayPal Webhook to POST to <code className="bg-[#202020] px-1.5 py-0.5 rounded text-[#D4D4D4]">{process.env.NEXT_PUBLIC_API_BASE}/api/paypal/webhook</code></p>
               </div>
             </div>
             
             <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white">
                     <i className="fas fa-info-circle text-lg"></i>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Important Notes</h4>
                </div>
                <ul className="space-y-2 text-xs text-[#888]">
                  <li>• Use sandbox credentials for testing, live credentials for production</li>
                  <li>• Return/cancel URLs are fixed at <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">/plan/success</code> and <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">/plan/cancel</code></li>
                  <li>• Ensure your PayPal app has the necessary permissions enabled</li>
                </ul>
             </div>
          </SettingsDrawerRow>
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
