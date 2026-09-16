export function AdminLedgerFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-[10px]">
        {/* Search input skeleton */}
        <div className="flex-1 h-[42px] bg-gradient-to-r from-[#121212] to-[#1a1a1a] rounded-[7px] animate-pulse border border-[#282828] w-full"></div>
        
        {/* Buttons skeleton */}
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <div className="w-[130px] h-[42px] bg-[#1a1a1a] rounded-lg animate-pulse border border-[#2a2a2a]"></div>
          <div className="w-[110px] h-[42px] bg-[#1a1a1a] rounded-lg animate-pulse border border-[#2a2a2a]"></div>
        </div>
      </div>
    </div>
  );
}

