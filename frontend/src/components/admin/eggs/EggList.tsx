"use client";

import { Settings, Egg, Server, Trash, Crown } from 'lucide-react';

export default function EggList({ eggs, onEdit, onDelete }: { eggs: any[], onEdit: (id: string) => void, onDelete: (id: string) => void }) {
  if (!eggs || eggs.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#666]">
        No eggs found. Create your first egg to get started.
      </div>
    );
  }

  // Group eggs by categoryName
  const groupedEggs = eggs.reduce((acc, egg) => {
    // We expect the backend to return categoryName. Fallback for safety.
    const categoryName = (egg as any).categoryName || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(egg);
    return acc;
  }, {} as Record<string, any[]>);

  const categories = Object.keys(groupedEggs).sort();

  return (
    <div className="w-full space-y-10">
      {categories.map((category) => (
        <div key={category} className="w-full">
          <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
            {category}
          </h2>

          <div className="w-full">
            {/* TABLE HEADER (Desktop) */}
            <div className="hidden gap-4 lg:grid lg:grid-cols-[2fr_100px_100px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20">
              <span>Egg Name</span>
              <span>Nest ID</span>
              <span>Egg ID</span>
              <span>Servers</span>
              <span className="text-right">Actions</span>
            </div>

            {/* TABLE LIST */}
            <div className="divide-y divide-white/[0.06]">
              {groupedEggs[category].map((egg: any) => (
                <div
                  key={egg._id}
                  className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid-cols-[2fr_100px_100px_80px_100px] lg:items-center"
                >
                  {/* Egg Name */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      Egg Name
                    </p>
                    <div className="flex items-center gap-3">
                      {egg.icon ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${egg.icon}`}
                          alt={egg.name}
                          className="w-6 h-6 rounded object-contain shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Egg size={16} className="text-[#888] shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="block truncate font-mono text-sm text-[#DDDDDD]">
                            {egg.name}
                          </span>
                          {egg.allowedPlanNames && egg.allowedPlanNames.length > 0 && (
                            <div title={`Requires plan: ${egg.allowedPlanNames.join(', ')}`} className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                              <Crown size={14} fill="currentColor" />
                            </div>
                          )}
                          {egg.recommended && (
                            <span className="inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                              Recommended
                            </span>
                          )}
                        </div>
                        {egg.description && (
                          <span className="truncate text-[10px] text-[#555]">
                            {egg.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nest ID */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      Nest ID
                    </p>
                    <span className="truncate text-sm font-mono text-[#D4D4D4]">
                      {egg.pterodactylNestId}
                    </span>
                  </div>
                  
                  {/* Egg ID */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      Egg ID
                    </p>
                    <span className="truncate text-sm font-mono text-[#D4D4D4]">
                      {egg.pterodactylEggId}
                    </span>
                  </div>

                  {/* Servers Count */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      Servers
                    </p>
                    <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
                      <Server size={14} className="text-[#FF5722]" />
                      <span className="truncate">{egg.serversCount || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
                      <div className="flex lg:justify-end gap-2">
                        <button
                          onClick={() => onEdit(egg._id)}
                          className="bg-white/5 border border-white/5 rounded p-1.5 text-[#888] hover:bg-white/10 hover:text-[#ddd] transition-colors"
                          title="Edit Egg"
                        >
                          <Settings size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            if (egg.serversCount > 0) {
                              e.preventDefault();
                              return;
                            }
                            onDelete(egg._id);
                          }}
                          disabled={egg.serversCount > 0}
                          className={`border rounded p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${egg.serversCount > 0 ? 'bg-red-500/0 border-transparent text-red-500/30' : 'bg-red-500/5 border-red-500/10 text-red-500/70 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500'}`}
                          title={egg.serversCount > 0 ? "Cannot delete an egg that is in use by servers" : "Delete Egg"}
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

