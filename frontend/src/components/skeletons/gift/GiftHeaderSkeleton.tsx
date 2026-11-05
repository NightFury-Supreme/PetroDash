import React from 'react';

export function GiftHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-2">
        <div className="h-7 bg-[#2a2a2a] rounded w-48 animate-pulse" />
        <div className="h-4 bg-[#222] rounded w-64 animate-pulse" />
      </div>
      <div className="flex items-center gap-4">
        <div className="w-[110px] h-[34px] bg-[#202020] border border-white/[0.06] rounded-md animate-pulse" />
      </div>
    </div>
  );
}

export default GiftHeaderSkeleton;
