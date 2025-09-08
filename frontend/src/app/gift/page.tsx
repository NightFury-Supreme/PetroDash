"use client";

import { useEffect, useState } from "react";
import GiftCard from "@/components/gift/GiftCard";
import GiftCardSkeleton from "@/components/skeletons/gift/GiftCardSkeleton";
import GiftCreateCard from "@/components/gift/GiftCreateCard";
import GiftMyCodes from "@/components/gift/GiftMyCodes";
import Shell from "@/components/Shell";

export default function GiftRedeemPage() {
  const [mounted, setMounted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  useEffect(() => { const t = setTimeout(() => setMounted(true), 250); return () => clearTimeout(t); }, []);

  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fas fa-gift text-white"></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Gift</h1>
            <p className="text-[#AAAAAA]">Redeem your gift codes to receive coins and resources.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="px-4 py-2 rounded-lg border bg-white text-black border-[#303030]" onClick={() => setCreating(true)}>Create Code</button>
        </div>

        <div className="bg-[#181818] border border-[#303030] rounded-xl p-0 overflow-hidden">
          {mounted ? <GiftCard /> : <GiftCardSkeleton />}
        </div>

        <div className="bg-[#181818] border border-[#303030] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4">
            <button
              className={`px-3 py-1.5 rounded-lg border text-sm ${tab === 'active' ? 'bg-white text-black' : 'bg-[#202020] text-white'} border-[#303030]`}
              onClick={() => setTab('active')}
            >Active</button>
            <button
              className={`px-3 py-1.5 rounded-lg border text-sm ${tab === 'inactive' ? 'bg-white text-black' : 'bg-[#202020] text-white'} border-[#303030]`}
              onClick={() => setTab('inactive')}
            >Inactive</button>
          </div>
          {mounted ? <GiftMyCodes filter={tab} /> : null}
        </div>

        {creating && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="w-full max-w-2xl bg-[#181818] border border-[#303030] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030]">
                <div className="text-lg font-semibold">Create Gift Code</div>
                <button onClick={() => setCreating(false)} className="px-3 py-1 rounded bg-[#202020]">Close</button>
              </div>
              <GiftCreateCard />
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}


