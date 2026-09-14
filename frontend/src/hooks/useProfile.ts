"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useEffect, useState, useCallback } from 'react';

export type Session = {
  id: string;
  device: string;
  deviceType: string;
  browser: string;
  ip: string;
  lastActive: string;
  current: boolean;
};

export function useProfile() {
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', coins: 0, joinedAt: '', loginMethod: 'email', oauthProviders: {}, emailVerified: false, emailVerification: true, profilePicture: '', tfaEnabled: false, pterodactylUserId: null as string | null });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) { setLoading(false); return; }
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const [r, brandingRes] = await Promise.all([
        fetchWithRetry(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchWithRetry(`${base}/api/branding`, { cache: 'no-store' })
      ]);
      let d: any = {}; try { d = await r.json(); } catch {}
      let brandingData: any = {}; try { brandingData = await brandingRes.json(); } catch {}
      if (!r.ok) {
        if (r.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          return;
        }
        throw new Error(d?.error || 'Failed to load profile');
      }
      setForm({
        username: d.username || '',
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: d.email || '',
        coins: typeof d.coins === 'number' ? d.coins : (typeof d.balance === 'number' ? d.balance : 0),
        joinedAt: d.createdAt || d.joinedAt || '',
        loginMethod: d.loginMethod || 'email',
        oauthProviders: d.oauthProviders || {},
        emailVerified: Boolean(d.emailVerified),
        emailVerification: typeof brandingData.emailVerification === 'boolean' ? brandingData.emailVerification : true,
        profilePicture: d.profilePicture || '',
        tfaEnabled: Boolean(d.tfaEnabled),
        pterodactylUserId: d.pterodactylUserId || null
      });
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setSessions(data);
      } else if (r.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    } catch {}
  }, []);

  useEffect(() => { 
    load(); 
    fetchSessions();
  }, [load, fetchSessions]);

  const saveProfile = useCallback(async (updates: Record<string, any>) => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem('auth_token');
      // Only send the specific fields being updated, never send the full form
      const payload: Record<string, any> = {};
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.firstName !== undefined) payload.firstName = updates.firstName;
      if (updates.lastName !== undefined) payload.lastName = updates.lastName;

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) {
        // Extract field-level errors from Zod validation response
        let message = d?.error || 'Failed to update profile';
        if (d?.details?.fieldErrors) {
          const fieldMsgs = Object.entries(d.details.fieldErrors as Record<string, string[]>)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
            .join('; ');
          if (fieldMsgs) message = fieldMsgs;
        }
        throw new Error(message);
      }
      // Update local form with server response
      setForm(f => ({
        ...f,
        username: d.username ?? f.username,
        firstName: d.firstName ?? f.firstName,
        lastName: d.lastName ?? f.lastName,
      }));
      setSuccess('Profile updated');
    } catch (e: any) { throw e; } finally { setSaving(false); }
  }, []);


  const updatePassword = useCallback(async (currentPassword: string, newPassword: string, tfaCode?: string) => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword, ...(tfaCode ? { tfaCode } : {}) })
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) {
        let message = d?.error || 'Failed to update password';
        if (d?.details?.fieldErrors) {
          const fieldMsgs = Object.entries(d.details.fieldErrors as Record<string, string[]>)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`).join('; ');
          if (fieldMsgs) message = fieldMsgs;
        }
        throw new Error(message);
      }
      setSuccess('Password updated');
    } catch (e: any) { throw e; } finally { setSaving(false); }
  }, []);

  const updateProfilePicture = useCallback(async (profilePicture: string) => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me/profile-picture`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ profilePicture }) 
      });
      let d: any = {}; try { d = await r.json(); } catch {} 
      if (!r.ok) throw new Error(d?.error || d?.message || 'Failed to update profile picture');
      setForm((f) => ({ ...f, profilePicture: d.profilePicture || '' }));
      setSuccess('Profile picture updated');
      // Reload to refresh sidebar
      await load();
    } catch (e: any) { throw e; } finally { setSaving(false); }
  }, [load]);

  const revokeSession = useCallback(async (id: string) => {
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/sessions/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!r.ok) {
        let d: any = {}; try { d = await r.json(); } catch {}
        throw new Error(d?.error || 'Failed to revoke session');
      }
      setSessions(prev => prev.filter(s => s.id !== id));
      setSuccess('Session revoked successfully');
    } catch (e: any) {
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const resendVerification = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/verify/resend`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: form.email })
      });
      if (!r.ok) {
        let d: any = {}; try { d = await r.json(); } catch {}
        if (r.status === 429) {
          const err: any = new Error(d?.message || d?.error || 'Too many requests');
          err.retryAfter = d?.retryAfter || 60;
          throw err;
        }
        throw new Error(d?.error || 'Failed to send verification email');
      }
      setSuccess('Verification email sent');
    } catch (e: any) {
      throw e;
    } finally {
      setSaving(false);
    }
  }, [form.email]);

  const verifyEmailCode = useCallback(async (code: string) => {
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/verify/code`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: form.email, code })
      });
      if (!r.ok) {
        let d: any = {}; try { d = await r.json(); } catch {}
        throw new Error(d?.error || 'Failed to verify code');
      }
      setForm(f => ({ ...f, emailVerified: true }));
      setSuccess('Email verified successfully');
    } catch (e: any) {
      throw e;
    } finally {
      setSaving(false);
    }
  }, [form.email]);

  return { form, setForm, loading, saving, error, success, sessions, saveProfile, updatePassword, updateProfilePicture, fetchSessions, revokeSession, resendVerification, verifyEmailCode };
}
