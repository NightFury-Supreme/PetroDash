export function AdminLedgerFiltersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className="h-12 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse shadow-sm border border-[#303030]" 
          style={{ 
            animationDelay: `${i * 150}ms`,
            animationDuration: '1.5s'
          }}
        ></div>
      ))}
    </div>
  );
}

