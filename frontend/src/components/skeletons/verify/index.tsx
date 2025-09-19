"use client";

export default function VerifySkeleton() {
  return (
    <section className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#202020] animate-pulse" />
          <div className="h-6 w-44 bg-[#202020] rounded animate-pulse" />
        </div>
        <div className="h-4 w-80 bg-[#202020] rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          <div className="h-11 bg-[#202020] rounded animate-pulse" />
          <div className="h-11 bg-[#202020] rounded animate-pulse" />
          <div className="h-10 bg-[#202020] rounded animate-pulse" />
        </div>
      </div>
    </section>
  );
}
