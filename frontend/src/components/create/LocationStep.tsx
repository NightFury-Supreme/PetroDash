"use client";

import { useState } from 'react';
import { Location, FormData, Violations } from './types';
import Link from 'next/link';

interface LocationStepProps {
  locations: Location[];
  form: FormData;
  violations: Violations;
  onInputChange: (field: keyof FormData, value: string) => void;
}

export function LocationStep({ locations, form, violations, onInputChange }: LocationStepProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoPlans, setInfoPlans] = useState<Array<{ _id: string; name: string }>>([]);

  const openPlansInfo = async (allowedPlans: string[] | undefined) => {
    try {
      setInfoOpen(true);
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
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Server Location</h2>
        <p className="text-[#AAAAAA] text-sm">Select the optimal location for your server based on ping and availability</p>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-white">
          Select Location <span className="text-red-400">*</span>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => {
            const isFull = Number(location.serverCount || 0) >= Number(location.serverLimit || 0);
            const hasPremium = Array.isArray((location as any).allowedPlans) && (location as any).allowedPlans.length > 0;
            const locked = hasPremium && !(location as any).isPlanAllowed;
            const selected = form.locationId === location._id;
            return (
              <button
                key={location._id}
                type="button"
                onClick={() => {
                  if (isFull) return;
                  if (locked) {
                    openPlansInfo((location as any).allowedPlans);
                    return;
                  }
                  onInputChange('locationId', location._id);
                }}
                className={`p-4 border rounded-xl transition-all text-left ${
                  selected
                    ? 'border-white bg-white/10'
                    : 'border-[#303030] hover:border-[#404040]'
                } ${(isFull || locked) ? 'opacity-50 cursor-pointer' : ''}`}
                aria-disabled={isFull || locked}
              >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  {location.flag && (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_BASE}${location.flag}`} 
                      alt={location.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{location.name}</h4>
                    {location.ping && (
                      <span className="text-sm text-[#AAAAAA]">({location.ping}ms)</span>
                    )}
                    {isFull && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Full</span>
                    )}
                    {!isFull && hasPremium && (
                      <span
                        onClick={(e) => { e.stopPropagation(); openPlansInfo((location as any).allowedPlans); }}
                        className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#3A2F00] text-[#FFD700] border border-[#806b00] hover:brightness-110 cursor-pointer"
                        title="View plans that unlock this"
                      >
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Location Stats */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#AAAAAA]">Servers</span>
                  <span className="text-sm text-white font-semibold">{location.serverCount}/{location.serverLimit}</span>
                </div>
              </div>
            </button>
            );
          })}
        </div>
        
        {violations.locationId && (
          <div className="text-xs text-red-400">{violations.locationId}</div>
        )}
      </div>

      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-[#202020] border border-[#303030] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Premium Access</h3>
              <button className="text-[#AAAAAA] hover:text-white" onClick={() => { setInfoOpen(false); setInfoPlans([]); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            {infoPlans.length === 0 ? (
              <div className="text-[#AAAAAA]">No specific plans found. Please check the shop.</div>
            ) : (
              <ul className="space-y-2">
                {infoPlans.map(p => (
                  <li key={p._id} className="flex items-center justify-between text-white bg-[#181818] border border-[#303030] rounded-lg px-3 py-2">
                    <span>{p.name}</span>
                    <a href={`/shop?highlight=${p._id}`} className="text-[#3ea6ff] hover:underline">View</a>
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
