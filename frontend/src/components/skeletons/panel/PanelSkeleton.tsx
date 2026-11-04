import React from 'react';

export function CredentialRowSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(250px,1fr)_1fr_120px] items-center gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse" />
        <div>
          <div className="h-3.5 w-24 rounded bg-[#2a2a2a] animate-pulse" />
          <div className="mt-1 h-2.5 w-32 rounded bg-[#222] animate-pulse" />
        </div>
      </div>

      <div className="flex items-center min-w-0">
        <div className="h-3.5 w-32 rounded bg-[#2a2a2a] animate-pulse" />
      </div>

      <div className="flex items-center justify-end">
        <div className="h-8 w-20 rounded-md bg-[#202020] border border-white/[0.06] animate-pulse" />
      </div>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="h-8 w-40 bg-[#2a2a2a] animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-[#222] animate-pulse rounded" />
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(250px,1fr)_1fr_120px] items-center border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
          <div className="h-2.5 w-16 bg-[#222] animate-pulse rounded" />
          <div className="h-2.5 w-16 bg-[#222] animate-pulse rounded" />
          <div className="flex justify-end">
            <div className="h-2.5 w-12 bg-[#222] animate-pulse rounded" />
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <CredentialRowSkeleton />
          <CredentialRowSkeleton />
          <CredentialRowSkeleton />
        </div>
      </section>
    </div>
  );
}

export default PanelSkeleton;
