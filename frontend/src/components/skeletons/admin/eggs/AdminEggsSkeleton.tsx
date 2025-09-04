"use client";

export default function AdminEggsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#202020] rounded-2xl animate-pulse" />
          <div>
            <div className="h-6 w-40 bg-[#202020] rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-[#202020] rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-28 bg-[#202020] rounded-md animate-pulse" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="h-4 w-40 bg-[#202020] rounded animate-pulse mb-2" />
            <div className="h-3 w-64 bg-[#202020] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}


