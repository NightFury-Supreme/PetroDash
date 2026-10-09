"use client";

import { Globe, Settings, Server, Trash, Crown } from 'lucide-react';

export default function LocationList({ locations, onEdit, onDelete }: { locations: any[], onEdit: (id: string) => void, onDelete: (id: string) => void }) {
  if (!locations || locations.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#666]">
        No locations found. Create your first location to get started.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* TABLE HEADER */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[2fr_120px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20">
        <span>Location Name</span>
        <span>Server Limit</span>
        <span>Servers</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {locations.map((loc: any) => (
          <div
            key={loc._id}
            className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid-cols-[2fr_120px_80px_100px] lg:items-center"
          >
            {/* Location Name */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">Location Name</p>
              <div className="flex items-center gap-3">
                {loc.flag ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${loc.flag}`}
                    alt={loc.name}
                    className="w-6 h-6 rounded object-contain shrink-0"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Globe size={16} className="text-[#888] shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="block truncate font-mono text-sm text-[#DDDDDD]">{loc.name}</span>
                    {loc.allowedPlanNames && loc.allowedPlanNames.length > 0 && (
                      <div title={`Requires plan: ${loc.allowedPlanNames.join(', ')}`} className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                        <Crown size={14} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  {loc.latencyUrl && (
                    <p className="mt-0.5 truncate text-xs text-[#888]">{loc.latencyUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Server Limit */}
            <div className="min-w-0 lg:text-left">
              <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">Server Limit</p>
              <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
                <span>{loc.serverLimit === 0 ? 'Unlimited' : loc.serverLimit}</span>
              </div>
            </div>

            {/* Servers count */}
            <div className="min-w-0 lg:text-left">
              <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">Servers</p>
              <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
                <Server size={14} className="text-[#FF5722]" />
                <span className="truncate">{loc.serversCount || 0}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
              <div className="flex lg:justify-end gap-2">
                <button
                  onClick={() => onEdit(loc._id)}
                  className="bg-white/5 border border-white/5 rounded p-1.5 text-[#888] hover:bg-white/10 hover:text-[#ddd] transition-colors"
                  title="Edit Location"
                >
                  <Settings size={15} />
                </button>
                <button
                  onClick={(e) => {
                    if ((loc.serversCount || 0) > 0) { e.preventDefault(); return; }
                    onDelete(loc._id);
                  }}
                  disabled={(loc.serversCount || 0) > 0}
                  className={`border rounded p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${(loc.serversCount || 0) > 0 ? 'bg-red-500/0 border-transparent text-red-500/30' : 'bg-red-500/5 border-red-500/10 text-red-500/70 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500'}`}
                  title={(loc.serversCount || 0) > 0 ? 'Cannot delete a location that is in use by servers' : 'Delete Location'}
                >
                  <Trash size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
