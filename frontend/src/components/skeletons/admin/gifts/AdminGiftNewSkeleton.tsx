export function AdminGiftNewSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#1e1e1e] rounded-lg animate-pulse" />
        <div className="w-16 h-16 bg-[#1e1e1e] rounded-2xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-[#1e1e1e] rounded-md animate-pulse" />
          <div className="h-4 w-56 bg-[#1e1e1e] rounded-md animate-pulse" />
        </div>
      </div>

      {[0,1,2,3].map((i) => (
        <div key={i} className="rounded-2xl p-6 space-y-6 mb-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-10 w-full bg-[#1e1e1e] rounded-md animate-pulse" />
            <div className="h-10 w-full bg-[#1e1e1e] rounded-md animate-pulse" />
            <div className="h-10 w-full bg-[#1e1e1e] rounded-md animate-pulse md:col-span-2" />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-3">
        <div className="h-10 w-24 bg-[#1e1e1e] rounded-md animate-pulse" />
        <div className="h-10 w-32 bg-[#1e1e1e] rounded-md animate-pulse" />
      </div>
    </div>
  );
}



