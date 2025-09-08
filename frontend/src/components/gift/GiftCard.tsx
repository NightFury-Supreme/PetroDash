"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/components/Modal";

export default function GiftCard() {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; rewards?: any } | null>(null);
  const modal = useModal();

  useEffect(() => { setResult(null); }, [code]);

  const redeem = async () => {
    try {
      setSubmitting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) { setResult({ success: false, message: 'Please login to redeem a gift.' }); return; }
      const codeToSend = String(code || '').trim().toUpperCase();
      if (!/^[A-Z0-9]{4,32}$/.test(codeToSend)) { setResult({ success: false, message: 'Invalid code format' }); return; }
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/gifts/redeem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ code })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Redeem failed');
      setResult({ success: true, message: d?.message || 'Redeemed!', rewards: d?.rewards });
      const rewards = d?.rewards || {};
      const parts: string[] = ['Your rewards have been applied.'];
      if (typeof rewards.coins === 'number' && rewards.coins > 0) parts.push(`+${rewards.coins} coins`);
      const resourcesObj = rewards.resources || {};
      const hasRes = ['diskMb','memoryMb','cpuPercent','backups','databases','allocations','serverSlots'].some((k) => (resourcesObj as any)[k] > 0);
      if (hasRes) parts.push('Resources updated');
      await modal.success({ title: 'Gift Redeemed', body: parts.join('\n') });
      setCode("");
    } catch (e: any) {
      setResult({ success: false, message: e?.message || 'Redeem failed' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
      <div className="space-y-4">
        <label className="text-sm text-[#AAAAAA]">Gift code</label>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder:text-[#777] focus:outline-none focus:ring-2 focus:ring-[#444]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER CODE"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
              <i className="fas fa-gift" />
            </div>
          </div>
          <button
            onClick={redeem}
            disabled={!code || submitting}
            className="px-4 py-3 text-sm rounded-lg bg-white text-black hover:bg-gray-100 transition-colors shadow disabled:opacity-70"
          >
            {submitting ? 'Redeeming...' : 'Redeem'}
          </button>
        </div>

        {result && (
          <div className={`text-sm rounded-lg px-4 py-3 border ${result.success ? 'text-green-300 bg-green-900/20 border-green-700/50' : 'text-red-300 bg-red-900/20 border-red-700/50'}`}>
            {result.message}
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#202020] border border-[#404040] flex items-center justify-center">
              <i className="fas fa-circle-question text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">How do gifts work?</h3>
          </div>
          <ol className="space-y-3 list-none">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <div className="font-medium">Enter your gift code 🎁</div>
                <div className="text-[#AAAAAA] text-sm">Type the code you received and press Redeem.</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <div className="font-medium">Get your rewards ✨</div>
                <div className="text-[#AAAAAA] text-sm">Coins and resources will be added to your account instantly.</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <div className="font-medium">One-time redemption per user 🔒</div>
                <div className="text-[#AAAAAA] text-sm">Codes may have limits, expiration dates, or per-user restrictions.</div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}


