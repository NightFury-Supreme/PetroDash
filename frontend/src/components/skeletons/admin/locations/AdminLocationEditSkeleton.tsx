"use client";

export default function AdminLocationEditSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#202020] rounded-xl animate-pulse" />
        <div className="w-12 h-12 bg-[#202020] rounded-2xl animate-pulse" />
        <div>
          <div className="h-6 w-40 bg-[#202020] rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-[#202020] rounded animate-pulse" />
        </div>
      </div>
      <div className="rounded-2xl p-6 space-y-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-28 bg-[#202020] rounded animate-pulse" />
            <div className="h-10 w-full bg-[#202020] rounded-md animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-4">
        <div className="h-10 w-24 bg-[#202020] rounded-md animate-pulse" />
        <div className="h-10 w-32 bg-[#202020] rounded-md animate-pulse" />
      </div>
    </div>
  );
}


