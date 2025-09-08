"use client";

import { useState } from "react";

export default function GiftCreateCard() {
  const [coins, setCoins] = useState<number>(0);
  const [maxRedemptions, setMaxRedemptions] = useState<number>(1);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [description, setDescription] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ code?: string; error?: string } | null>(null);

  const createCode = async () => {
    try {
      setCreating(true);
      setResult(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) { setResult({ error: 'Please login first' }); return; }
      if (!Number.isFinite(coins) || coins <= 0) { setResult({ error: 'Enter valid coins' }); return; }
      if (!Number.isFinite(maxRedemptions) || maxRedemptions < 1) { setResult({ error: 'Enter valid max redemptions' }); return; }
      if (!Number.isFinite(expiresInDays) || expiresInDays < 1) { setResult({ error: 'Enter valid days' }); return; }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/gifts/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coins, maxRedemptions, expiresInDays, description })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Failed to create code');
      setResult({ code: d.code });
    } catch (e: any) {
      setResult({ error: e?.message || 'Failed to create code' });
    } finally { setCreating(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label>
          <div className="label">Coins to share *</div>
          <input type="number" min={1} className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg px-3 py-2" value={coins}
                 onChange={(e) => setCoins(Number(e.target.value) || 0)} placeholder="100" />
        </label>
        <label>
          <div className="label">Max redemptions</div>
          <input type="number" min={1} className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg px-3 py-2" value={maxRedemptions}
                 onChange={(e) => setMaxRedemptions(Number(e.target.value) || 1)} />
        </label>
        <label>
          <div className="label">Expires in (days)</div>
          <input type="number" min={1} className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg px-3 py-2" value={expiresInDays}
                 onChange={(e) => setExpiresInDays(Number(e.target.value) || 30)} />
        </label>
        <label className="md:col-span-2">
          <div className="label">Description</div>
          <input className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg px-3 py-2" value={description}
                 onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button onClick={createCode} disabled={creating || coins <= 0} className="px-5 py-3 bg-white text-black rounded-lg">
          {creating ? 'Creating…' : 'Create Code'}
        </button>
      </div>

      {result?.code && (
        <div className="mt-4 text-sm rounded-lg px-4 py-3 border text-green-300 bg-green-900/20 border-green-700/50">
          Code created: <span className="font-mono">{result.code}</span>
        </div>
      )}
      {result?.error && (
        <div className="mt-4 text-sm rounded-lg px-4 py-3 border text-red-300 bg-red-900/20 border-red-700/50">
          {result.error}
        </div>
      )}
    </div>
  );
}



