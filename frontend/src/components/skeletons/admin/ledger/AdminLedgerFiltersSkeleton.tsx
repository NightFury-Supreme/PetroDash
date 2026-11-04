import React from 'react';

export function AdminLedgerFiltersSkeleton() {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-[10px]">
        <div className="flex-1 h-[42px] bg-[#141414] rounded-[7px] animate-pulse border border-white/[0.06] w-full flex items-center px-[13px]">
          <div className="h-4 w-4 rounded-full bg-[#222] animate-pulse" />
          <div className="ml-2 h-3 w-48 bg-[#222] rounded animate-pulse" />
        </div>

        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <div className="w-[115px] h-[42px] bg-[#202020] rounded-[7px] animate-pulse border border-white/[0.06]" />
          <div className="w-[180px] h-[42px] bg-[#202020] rounded-[7px] animate-pulse border border-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export default AdminLedgerFiltersSkeleton;
