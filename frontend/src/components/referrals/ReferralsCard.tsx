"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/components/Modal";

type RefData = { code: string; link: string; referredCount: number; coinsEarned: number; canCustomize?: boolean; referrerCoins?: number; referredCoins?: number; minInvites?: number };

export function ReferralsCard() {
  const [data, setData] = useState<RefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const modal = useModal();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setError('Not authenticated'); setLoading(false); return; }
    const fetchRef = async () => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/referrals/me`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || 'Failed to load referrals');
        setData(d as RefData);
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally { setLoading(false); }
    };
    fetchRef();
  }, []);

  const onCopy = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="h-10 bg-[#202020] rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#101010] border border-[#2a2a2a] rounded-lg p-4">
                <div className="h-4 w-24 bg-[#202020] rounded mb-2 animate-pulse" />
                <div className="h-6 w-20 bg-[#202020] rounded animate-pulse" />
              </div>
            )).slice(0,3)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-6 text-red-400">{error}</div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <div className="p-6 space-y-6">
        <div>
          <label className="text-sm text-[#AAAAAA]">Your referral link</label>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <input className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg pl-10 pr-3 py-3 text-sm" value={data.link} readOnly />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
                <i className="fas fa-link" />
              </div>
            </div>
            <button onClick={onCopy} className="px-4 py-3 text-sm rounded-lg bg-white text-black hover:bg-gray-100 transition-colors shadow">
              <i className="fas fa-copy mr-2" /> {copied ? 'Copied' : 'Copy'}
            </button>
            {data.canCustomize && (
              <button
                className="px-3 py-3 text-sm rounded-lg bg-[#202020] border border-[#2a2a2a] hover:bg-[#262626] transition-colors text-white"
                title="Edit referral code"
                onClick={async () => {
                  const current = data.code || '';
                  const origin = (() => {
                    const parts = data.link.split('/join/');
                    return parts.length > 1 ? parts[0] + '/join/' : data.link;
                  })();
                  const newCode = await modal.prompt({
                    title: 'Edit referral code',
                    body: 'Update your referral code',
                    defaultValue: current,
                    prefix: origin,
                    confirmText: 'Save',
                    cancelText: 'Cancel',
                  });
                  if (!newCode) return;
                  try {
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    setSaving(true);
                    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/referrals/custom-code`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ code: newCode })
                    });
                    const d = await r.json();
                    if (!r.ok) throw new Error(d?.error || 'Failed to set code');
                    setData((prev) => prev ? { ...prev, code: d.code, link: `${origin}${encodeURIComponent(d.code)}` } : prev);
                  } catch (_) {
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <i className="fas fa-pen" />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{label:'Users Referred', value:String(data.referredCount), icon:'fa-users'},
            {label:'Coins Earned', value:String(data.coinsEarned), icon:'fa-coins'}].map((s, idx) => (
            <div key={idx} className="bg-[#101010] border border-[#2a2a2a] rounded-xl p-4 relative">
              <div className="relative flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-[#AAAAAA]">
                  <i className={`fas ${s.icon}`} />
                </div>
                <div>
                  <div className="text-[#AAAAAA] text-xs">{s.label}</div>
                  <div className="text-xl font-extrabold">{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* How it works */}
        <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#202020] border border-[#404040] flex items-center justify-center">
              <i className="fas fa-circle-question text-white" />
            </div>
            <h2 className="text-lg font-bold">How do referrals work?</h2>
          </div>
          <ol className="space-y-3 list-none">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <div className="font-medium">Copy your referral link ✂️</div>
                <div className="text-[#AAAAAA] text-sm">You can find your referral link above.</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <div className="font-medium">Share your referral link 🤲</div>
                <div className="text-[#AAAAAA] text-sm">Send it to your friends, your family, make a YouTube video, a Tweet... Be creative!</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <div className="font-medium">Users register using your link 👪️</div>
                <div className="text-[#AAAAAA] text-sm">Only users that didn't have an account before will count as a referral!</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <div className="font-medium">Earn {typeof data.referrerCoins === 'number' ? data.referrerCoins : 50} coins! ✨</div>
                <div className="text-[#AAAAAA] text-sm">You get free coins without doing anything!{typeof data.referredCoins === 'number' ? ` New users also get ${data.referredCoins} coins.` : ''}</div>
              </div>
            </li>
          </ol>
        </div>
        {/* Reward and threshold boxes removed per request */}
        {!data.canCustomize && (typeof data.minInvites === 'number') && (
          <div className="text-sm text-[#AAAAAA]">
            Invite {Math.max(0, (data.minInvites || 0) - (data.referredCount || 0))} more user(s) to unlock custom referral codes.
          </div>
        )}
        {/* Inline edit removed; use pencil button + modal above */}
      </div>
    </div>
  );
}


