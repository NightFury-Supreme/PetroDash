export default function GiftCardSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-5">
        <div className="h-5 w-32 bg-[#1e1e1e] rounded-md animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-11 flex-1 rounded-lg border animate-pulse" style={{ borderColor: 'var(--border)', background: '#101010' }} />
          <div className="h-11 w-28 rounded-lg border animate-pulse" style={{ borderColor: 'var(--border)', background: '#202020' }} />
        </div>
        <div className="rounded-2xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="h-4 w-40 bg-[#1e1e1e] rounded-md mb-3 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-3/4 bg-[#1e1e1e] rounded-md animate-pulse" />
            <div className="h-3 w-2/3 bg-[#1e1e1e] rounded-md animate-pulse" />
            <div className="h-3 w-1/2 bg-[#1e1e1e] rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}


