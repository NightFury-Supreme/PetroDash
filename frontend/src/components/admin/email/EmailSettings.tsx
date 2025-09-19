"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import SmtpForm from '@/components/admin/email/SmtpForm';
import TemplatesEditor from '@/components/admin/email/TemplatesEditor';
import { useModal } from '@/components/Modal';
import AdminEmailSkeleton from '@/components/skeletons/admin/email/AdminEmailSkeleton';

type Smtp = { host?: string; port?: number; secure?: boolean; user?: string; pass?: string; fromEmail?: string };
type Template = { subject?: string; html?: string; text?: string };

interface Settings {
  payments?: { smtp?: Smtp };
  emailTemplates?: Record<string, Template>;
}

export default function EmailSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates'>('smtp');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('accountCreateWithVerification');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null), []);
  const [branding, setBranding] = useState<{ name?: string; logoUrl?: string; brandColor?: string; footerText?: string }>({});
  const modal = useModal();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/email`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to load settings');
      setSettings(d as Settings);
      try {
        const brandingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/branding`);
        const brandingData = await brandingResponse.json();
        if (brandingResponse.ok) {
          setBranding({ name: brandingData?.siteName || '', logoUrl: brandingData?.siteIconUrl || '', brandColor: '#0ea5e9', footerText: '' });
        }
      } catch {}
    } catch (e: any) {
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const updateField = (path: string, value: any) => {
    setSettings((prev) => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const parts = path.split('.');
      let cur = next as any;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, [path]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const smtp = settings?.payments?.smtp || {};
    if (!smtp.host) errs['payments.smtp.host'] = 'Host is required';
    if (!smtp.port || smtp.port <= 0) errs['payments.smtp.port'] = 'Port must be a positive number';
    if (!smtp.fromEmail) errs['payments.smtp.fromEmail'] = 'From email is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!token || !settings) return;
    if (!validate()) { setError('Please correct highlighted fields.'); return; }
    const confirmed = await modal.confirm({ title: 'Save Email Settings', body: 'Are you sure you want to save the email settings? This will update the SMTP configuration and email templates.' });
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payments: { smtp: settings.payments?.smtp }, emailTemplates: settings.emailTemplates })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to save settings');
      setSettings(d as Settings);
      await modal.success({ title: 'Settings Saved', body: 'Email settings have been saved successfully.' });
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
      await modal.error({ title: 'Save Failed', body: e?.message || 'Failed to save email settings.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplate = useMemo(() => {
    const map = settings?.emailTemplates || {};
    const key = selectedTemplateKey in map ? selectedTemplateKey : Object.keys(map)[0];
    return { key, tpl: key ? map[key] : undefined } as { key: string | undefined; tpl: Template | undefined };
  }, [settings, selectedTemplateKey]);

  if (loading) {
    return <AdminEmailSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
          <i className="fas fa-envelope text-white text-lg sm:text-2xl"></i>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Email Settings</h1>
          <p className="text-[#AAAAAA] text-base sm:text-lg">Configure SMTP server and email templates</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-4">
           {(['smtp','templates'] as const).map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm ${activeTab===tab?'text-white border-b-2 border-white':'text-[#bbb]'}`}>{tab.toUpperCase()}</button>
           ))}
         </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-900 rounded-lg transition-colors font-medium">
            {saving ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</>) : (<><i className="fas fa-save mr-2"></i>Save Settings</>)}
          </button>
        </div>
      </div>

      {!!error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300">{error}</div>
      )}

      {activeTab==='smtp' && (
        <div className="bg-[#181818] border border-[#303030] rounded-xl">
          <div className="flex items-center gap-3 p-6 border-b border-[#303030]">
            <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
              <i className="fas fa-server text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">SMTP Configuration</h3>
              <p className="text-[#AAAAAA] text-sm">Configure your email server settings</p>
            </div>
          </div>
          <SmtpForm smtp={settings?.payments?.smtp || {}} onChange={updateField} fieldErrors={fieldErrors} />
        </div>
      )}

      {activeTab==='templates' && (
        <div className="bg-[#181818] border border-[#303030] rounded-xl">
          <div className="flex items-center gap-3 p-6 border-b border-[#303030]">
            <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
              <i className="fas fa-envelope text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Email Templates</h3>
              <p className="text-[#AAAAAA] text-sm">Customize email templates for different events</p>
            </div>
          </div>
          <div className="p-6">
            <TemplatesEditor
              templates={settings?.emailTemplates || {}}
              brand={branding}
              token={token}
              selectedKey={selectedTemplate.key}
              onSelect={(k) => setSelectedTemplateKey(k)}
              onChange={updateField}
            />
          </div>
        </div>
      )}
    </div>
  );
}


