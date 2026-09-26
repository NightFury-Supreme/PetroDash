import React from 'react';

/** Inline skeleton — mirrors PlanEditForm section-by-section */
export function DrawerPlanSkeleton() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">

      {/* ── BASIC INFORMATION ── */}
      <div className="space-y-4">
        <div className="h-4 w-36 rounded bg-[#232323]" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan Name */}
          <div><div className="h-3 w-20 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Category */}
          <div><div className="h-3 w-16 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Description – full width */}
          <div className="sm:col-span-2">
            <div className="h-3 w-24 rounded bg-[#232323] mb-2" />
            <div className="h-[82px] w-full rounded-lg bg-[#1c1c1c]" />
          </div>
          {/* Valid From */}
          <div>
            <div className="h-3 w-20 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-44 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Valid Until */}
          <div>
            <div className="h-3 w-20 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-40 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Popular toggle – full width */}
          <div className="sm:col-span-2 flex items-center justify-between py-2">
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[#232323]" />
              <div className="h-3 w-64 rounded bg-[#1c1c1c]" />
            </div>
            <div className="h-6 w-11 rounded-full bg-[#232323] shrink-0" />
          </div>
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      {/* ── PRICING & AVAILABILITY ── */}
      <div className="space-y-4">
        <div className="h-4 w-44 rounded bg-[#232323]" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly Price */}
          <div><div className="h-3 w-32 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Strike-through Price */}
          <div><div className="h-3 w-36 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Stock */}
          <div>
            <div className="h-3 w-12 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-40 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Limit Per Customer */}
          <div>
            <div className="h-3 w-32 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-20 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Visibility – full width */}
          <div className="sm:col-span-2">
            <div className="h-3 w-20 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
          </div>
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      {/* ── RESOURCE LIMITS ── */}
      <div className="space-y-4">
        <div className="h-4 w-32 rounded bg-[#232323]" />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* CPU */}
          <div><div className="h-3 w-20 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Memory */}
          <div><div className="h-3 w-24 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Disk */}
          <div><div className="h-3 w-16 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Backups */}
          <div><div className="h-3 w-16 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Databases */}
          <div><div className="h-3 w-20 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Ports */}
          <div><div className="h-3 w-12 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Server Limit */}
          <div><div className="h-3 w-24 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Coins */}
          <div><div className="h-3 w-12 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
        </div>
      </div>

    </div>
  );
}
