"use client";

import { useState } from 'react';
import { Egg, FormData, Violations } from './types';
import Link from 'next/link';

interface EggStepProps {
  eggs: Egg[];
  form: FormData;
  violations: Violations;
  onInputChange: (field: keyof FormData, value: string) => void;
}

export function EggStep({ eggs, form, violations, onInputChange }: EggStepProps) {
  const [infoOpenFor, setInfoOpenFor] = useState<string | null>(null);
  const [infoPlans, setInfoPlans] = useState<Array<{ _id: string; name: string }>>([]);

  const openPlansInfo = async (allowedPlans: string[] | undefined) => {
    try {
      setInfoOpenFor('loading');
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/plans`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const allPlans = await resp.json();
      const ids = new Set((allowedPlans || []).map(String));
      const list = Array.isArray(allPlans)
        ? allPlans
            .map((p: any) => ({ _id: String(p?._id), name: String(p?.name || '') }))
            .filter((p: any) => ids.has(p._id))
        : [];
      setInfoPlans(list);
    } catch (_) {
      setInfoPlans([]);
    } finally {
      setInfoOpenFor('open');
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Server Software</h2>
        <p className="text-[#AAAAAA] text-sm">Choose the software and game type for your server</p>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-white">
          Select Software <span className="text-red-400">*</span>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eggs.map((egg) => {
            const hasPremium = Array.isArray((egg as any).allowedPlans) && (egg as any).allowedPlans.length > 0;
            const locked = hasPremium && !(egg as any).isPlanAllowed;
            const selected = form.eggId === egg._id;
            return (
              <button
                key={egg._id}
                type="button"
                onClick={() => {
                  if (locked) {
                    openPlansInfo((egg as any).allowedPlans);
                    return;
                  }
                  onInputChange('eggId', egg._id)
                }}
                className={`p-4 border rounded-xl transition-all text-left ${
                  selected ? 'border-white bg-white/10' : 'border-[#303030] hover:border-[#404040]'
                } ${locked ? 'opacity-50 cursor-pointer' : ''}`}
                aria-disabled={locked}
                title={locked ? 'Your plan does not allow this egg' : ''}
              >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  {egg.iconUrl && (
                    <img 
                      src={egg.iconUrl} 
                      alt={egg.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{egg.name}</h4>
                  <span className="text-xs text-[#AAAAAA]">{egg.category}</span>
                </div>
              </div>
              
              <p className="text-sm text-[#AAAAAA] mb-3 line-clamp-2">
                {egg.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#AAAAAA]">
                  Used by {egg.serverCount || 0} servers
                </span>
                {hasPremium && (
                  <span
                    onClick={(e) => { e.stopPropagation(); openPlansInfo((egg as any).allowedPlans); }}
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#3A2F00] text-[#FFD700] border border-[#806b00] hover:brightness-110 cursor-pointer"
                    title="View plans that unlock this"
                  >
                    Premium
                  </span>
                )}
              </div>
            </button>
            );
          })}
        </div>
        
        {violations.eggId && (
          <div className="text-xs text-red-400">{violations.eggId}</div>
        )}
      </div>

      {infoOpenFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-[#202020] border border-[#303030] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Premium Access</h3>
              <button className="text-[#AAAAAA] hover:text-white" onClick={() => { setInfoOpenFor(null); setInfoPlans([]); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            {infoOpenFor === 'loading' ? (
              <div className="text-[#AAAAAA]">Loading plans…</div>
            ) : infoPlans.length === 0 ? (
              <div className="text-[#AAAAAA]">No specific plans found. Please check the shop.</div>
            ) : (
              <ul className="space-y-2">
                {infoPlans.map(p => (
                  <li key={p._id} className="flex items-center justify-between text-white bg-[#181818] border border-[#303030] rounded-lg px-3 py-2">
                    <span>{p.name}</span>
                    <Link href={`/shop?highlight=${p._id}`} className="text-[#3ea6ff] hover:underline">View</Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-end">
              <Link href="/shop" className="bg-[#303030] hover:bg-[#404040] text-white px-4 py-2 rounded-lg">Go to Shop</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
