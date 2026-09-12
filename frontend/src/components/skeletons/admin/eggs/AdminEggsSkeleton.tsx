"use client";

const Shimmer = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded ${className}`} />
);

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[2fr_100px_100px_80px_100px] lg:items-center">
      {/* Egg Name */}
      <div className="min-w-0">
        <Shimmer className="mb-1 h-[9px] w-14 bg-white/[0.04] lg:hidden" />
        <div className="flex items-center gap-3">
          <Shimmer className="w-6 h-6 shrink-0 bg-white/[0.04]" />
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <Shimmer className="h-[14px] w-[130px] bg-white/[0.04]" />
            <Shimmer className="h-[10px] w-[190px] bg-white/[0.04]" />
          </div>
        </div>
      </div>

      {/* Nest ID */}
      <div className="min-w-0">
        <Shimmer className="mb-1 h-[9px] w-10 bg-white/[0.04] lg:hidden" />
        <Shimmer className="h-[14px] w-[40px] bg-white/[0.04]" />
      </div>

      {/* Egg ID */}
      <div className="min-w-0">
        <Shimmer className="mb-1 h-[9px] w-10 bg-white/[0.04] lg:hidden" />
        <Shimmer className="h-[14px] w-[40px] bg-white/[0.04]" />
      </div>

      {/* Servers */}
      <div className="min-w-0">
        <Shimmer className="mb-1 h-[9px] w-10 bg-white/[0.04] lg:hidden" />
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-[14px] w-[14px] rounded-full bg-white/[0.04]" />
          <Shimmer className="h-[14px] w-[20px] bg-white/[0.04]" />
        </div>
      </div>

      {/* Actions */}
      <div className="min-w-0 mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-2">
          <Shimmer className="h-[30px] w-[30px] bg-white/[0.04]" />
          <Shimmer className="h-[30px] w-[30px] bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function SkeletonCategory({ rowCount }: { rowCount: number }) {
  return (
    <div className="w-full">
      {/* Category title */}
      <Shimmer className="mb-4 ml-2 h-7 w-[110px] bg-white/[0.04]" />

      <div className="w-full">
        {/* Table header */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-[2fr_100px_100px_80px_100px] border-b border-white/[0.06] px-5 pb-3">
          <Shimmer className="h-[10px] w-16 bg-white/[0.04]" />
          <Shimmer className="h-[10px] w-12 bg-white/[0.04]" />
          <Shimmer className="h-[10px] w-10 bg-white/[0.04]" />
          <Shimmer className="h-[10px] w-10 bg-white/[0.04]" />
          <Shimmer className="h-[10px] w-12 bg-white/[0.04] ml-auto" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: rowCount }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminEggsSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2.5">
            {/* "Eggs" title */}
            <Shimmer className="h-8 w-[90px] bg-white/[0.04]" />
            {/* subtitle */}
            <Shimmer className="h-4 w-[270px] bg-white/[0.04]" />
          </div>
          {/* "New Egg" button */}
          <Shimmer className="h-[34px] w-[88px] bg-white/[0.04]" />
        </div>

        {/* ── Search & Filters ── */}
        <section className="mt-[25px]">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            {/* Search bar */}
            <Shimmer className="h-[42px] flex-1 w-full bg-white/[0.04]" />
            {/* Filters button */}
            <Shimmer className="h-[42px] w-full sm:w-[100px] bg-white/[0.04]" />
          </div>
        </section>

        {/* ── Egg Table List ── */}
        <div className="w-full space-y-10">
          <SkeletonCategory rowCount={3} />
          <SkeletonCategory rowCount={2} />
        </div>

      </div>
    </div>
  );
}
