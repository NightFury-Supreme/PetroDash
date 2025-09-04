"use client";

import React from 'react';

export default function UserSummaryCard({ user, role, coins, serversCount, onSave, onDelete, saving, deleting, setUser }: any) {
  return (
    <div className="rounded-2xl p-6 flex items-center justify-between" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#202020] flex items-center justify-center text-white text-xl font-bold">
          {(user.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold flex items-center gap-2">
            <input value={user.username} onChange={(e) => setUser({ ...user, username: e.target.value })} className="px-2 py-1 rounded-md border border-[var(--border)] bg-[#181818] text-white" />
          </div>
          <div className="text-sm text-[#AAAAAA] flex items-center gap-2 mt-1">
            <input value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} className="px-2 py-1 rounded-md border border-[var(--border)] bg-[#181818] text-white text-sm" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 max-w-md">
            <input value={user.firstName || ''} onChange={(e) => setUser({ ...user, firstName: e.target.value })} placeholder="First name" className="px-2 py-1 rounded-md border border-[var(--border)] bg-[#181818] text-white text-sm" />
            <input value={user.lastName || ''} onChange={(e) => setUser({ ...user, lastName: e.target.value })} placeholder="Last name" className="px-2 py-1 rounded-md border border-[var(--border)] bg-[#181818] text-white text-sm" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5">Role: {role}</span>
            <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5">Coins: {coins}</span>
            <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5">Servers: {serversCount}</span>
          </div>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-md bg-white text-black border border-[var(--border)]">{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={onDelete} disabled={deleting} className="px-4 py-2 rounded-md bg-[#ef4444] text-white">{deleting ? 'Deleting…' : 'Delete'}</button>
      </div>
    </div>
  );
}


