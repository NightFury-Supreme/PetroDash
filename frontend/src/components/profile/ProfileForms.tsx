"use client";

import React, { useState } from 'react';

export function ProfileInfoForm({ form, setForm, saving, onSave }: { form: any; setForm: (f: any) => void; saving: boolean; onSave: () => void }) {
  return (
    <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">Username</label>
          <input className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">First Name</label>
          <input className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">Last Name</label>
          <input className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black">{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>
    </div>
  );
}

export function EmailChangeForm({ email, onSubmit, saving }: { email: string; onSubmit: (email: string, password: string) => void; saving: boolean }) {
  const [newEmail, setNewEmail] = useState(email);
  const [password, setPassword] = useState('');
  return (
    <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <h3 className="text-lg font-bold mb-4">Change Email</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">New Email</label>
          <input type="email" className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">Current Password</label>
          <input type="password" className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => onSubmit(newEmail, password)} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black">{saving ? 'Updating…' : 'Update Email'}</button>
      </div>
    </div>
  );
}

export function PasswordChangeForm({ onSubmit, saving }: { onSubmit: (currentPassword: string, newPassword: string) => void; saving: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  return (
    <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <h3 className="text-lg font-bold mb-4">Change Password</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">Current Password</label>
          <input type="password" className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#AAAAAA]">New Password</label>
          <input type="password" className="w-full bg-transparent border border-[#303030] rounded-lg p-3" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <p className="text-xs text-[#666666] mt-2">Minimum 8 characters, include letters and numbers.</p>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => onSubmit(currentPassword, newPassword)} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black">{saving ? 'Updating…' : 'Update Password'}</button>
      </div>
    </div>
  );
}



