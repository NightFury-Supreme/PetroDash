"use client";

import { useEffect, useState, useCallback } from 'react';

export function useProfile() {
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', coins: 0, joinedAt: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) { setLoading(false); return; }
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to load profile');
      setForm({
        username: d.username || '',
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: d.email || '',
        coins: typeof d.coins === 'number' ? d.coins : (typeof d.balance === 'number' ? d.balance : 0),
        joinedAt: d.createdAt || d.joinedAt || ''
      });
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveProfile = useCallback(async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ username: form.username, firstName: form.firstName, lastName: form.lastName }) });
      const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed');
      setSuccess('Profile updated');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }, [form]);

  const updateEmail = useCallback(async (email: string, password: string) => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile/email`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, password }) });
      const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed to update email');
      setForm((f) => ({ ...f, email: d.email }));
      setSuccess('Email updated');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile/password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword, newPassword }) });
      const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed to update password');
      setSuccess('Password updated');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }, []);

  return { form, setForm, loading, saving, error, success, saveProfile, updateEmail, updatePassword };
}




