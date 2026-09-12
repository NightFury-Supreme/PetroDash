"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import SmtpForm from '@/components/admin/email/SmtpForm';
import AdminEmailSkeleton from '@/components/skeletons/admin/email/AdminEmailSkeleton';

type Smtp = { host?: string; port?: number; secure?: boolean; user?: string; pass?: string; fromEmail?: string };

interface Settings {
  payments?: { smtp?: Smtp };
  auth?: { emailVerification?: boolean };
}

export default function EmailSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'smtp'>('smtp');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null), []);
    const { showSuccess, showError } = useToast();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/email`, { headers: { Authorization: `Bearer ${token}` } });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'Failed to load settings');
      setSettings(d as Settings);
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
      
      // Prevent prototype pollution
      if (parts.some(key => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
        return prev;
      }
      
      let cur = next as any;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        // Check each key in the path
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return prev;
        }
        cur[key] = cur[key] ?? {};
        cur = cur[key];
      }
      
      const finalKey = parts[parts.length - 1];
      // Final check before assignment
      if (finalKey !== '__proto__' && finalKey !== 'constructor' && finalKey !== 'prototype') {
        cur[finalKey] = value;
      } else {
        return prev;
      }
      
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

    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payments: { smtp: settings.payments?.smtp }, auth: settings.auth })
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'Failed to save settings');
      setSettings(d as Settings);
      showSuccess('Email settings have been saved successfully.');
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
      showError(e?.message || 'Failed to save email settings.');
    } finally {
      setSaving(false);
    }
  };

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
           {(['smtp'] as const).map(tab => (
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
          
          <div className="p-6 border-b border-[#303030]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Enable Email System</h4>
                <p className="text-sm text-[#AAAAAA] mt-1">If enabled, users will be required to verify their email address upon registration and email changes.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings?.auth?.emailVerification || false}
                onClick={() => updateField('auth.emailVerification', !(settings?.auth?.emailVerification || false))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${settings?.auth?.emailVerification ? 'bg-white' : 'bg-[#333]'}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${settings?.auth?.emailVerification ? 'bg-[#0f0f13] translate-x-2.5' : 'bg-white -translate-x-2.5'}`}
                />
              </button>
            </div>
          </div>

          <SmtpForm smtp={settings?.payments?.smtp || {}} auth={settings?.auth || {}} onChange={updateField} fieldErrors={fieldErrors} />
        </div>
      )}

    </div>
  );
}


