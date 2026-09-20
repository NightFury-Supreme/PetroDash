"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ProfileInfoForm({ form, setForm, saving, onSave }: { form: any; setForm: (f: any) => void; saving: boolean; onSave: () => void }) {
  const t = useTranslations('Profile');
  return (
    <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">{t('firstName')}</label>
          <input className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={form.firstName || ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">{t('lastName')}</label>
          <input className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">{t('username')}</label>
          <input className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
      </div>
      <div className="mt-6">
        <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black">{saving ? t('save') + '...' : t('save')}</button>
      </div>
    </div>
  );
}

export function EmailChangeForm({ email, onSubmit, saving }: { email: string; onSubmit: (email: string, password: string) => void; saving: boolean }) {
  const t = useTranslations('Profile');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">New {t('emailAddress')}</label>
          <input className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">{t('password')}</label>
          <input type="password" className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
      <div className="mt-6">
        <button onClick={() => onSubmit(newEmail, password)} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black">{saving ? t('save') + '...' : t('changeEmail')}</button>
      </div>
    </div>
  );
}

export function PasswordChangeForm({ onSubmit, saving }: { onSubmit: (currentPassword: string, newPassword: string) => void; saving: boolean }) {
  const t = useTranslations('Profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  return (
    <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">Current {t('password')}</label>
          <input type="password" className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">New {t('password')}</label>
          <input type="password" className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => onSubmit(currentPassword, newPassword)} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black">{saving ? t('save') + '...' : t('save')}</button>
      </div>
    </div>
  );
}
