"use client";

export default function AdminServersSkeleton() {
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
        <div className="hidden sm:block">
          <div className="h-6 w-14 bg-[#202020] rounded animate-pulse mb-2" />
          <div className="h-4 w-24 bg-[#202020] rounded animate-pulse" />
        </div>
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="h-5 w-40 bg-[#202020] rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="h-4 w-full bg-[#202020] rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


