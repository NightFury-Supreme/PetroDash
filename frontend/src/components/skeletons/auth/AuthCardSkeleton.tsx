export default function AuthCardSkeleton() {
  return (
    <section className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl p-8 animate-pulse" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#2a2a2a]" />
          <div className="h-5 w-32 bg-[#2a2a2a] rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-28 bg-[#2a2a2a] rounded" />
          <div className="h-4 w-48 bg-[#2a2a2a] rounded" />
          <div className="h-4 w-24 bg-[#2a2a2a] rounded" />
          <div className="h-10 w-full bg-[#2a2a2a] rounded" />
          <div className="h-4 w-24 bg-[#2a2a2a] rounded" />
          <div className="h-10 w-full bg-[#2a2a2a] rounded" />
          <div className="h-10 w-full bg-[#2a2a2a] rounded" />
        </div>
      </div>
    </section>
  );
}
