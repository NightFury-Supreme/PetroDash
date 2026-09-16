export function AdminLedgerFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-[10px]">
        {/* Search input skeleton */}
        <div className="flex-1 h-[42px] bg-[#121212] rounded-[7px] animate-pulse border border-[#282828] w-full flex items-center px-[13px]">
           <div className="h-4 w-4 rounded-full bg-[#202020] animate-pulse"></div>
           <div className="ml-2 h-3 w-48 bg-[#202020] rounded animate-pulse"></div>
        </div>
        
        {/* Buttons skeleton */}
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <div className="w-[150px] h-[42px] bg-[#1a1a1a] rounded-[7px] animate-pulse border border-[#222]"></div>
          <div className="w-[110px] h-[42px] bg-[#1a1a1a] rounded-[7px] animate-pulse border border-[#222]"></div>
        </div>
      </div>
    </div>
  );
}

