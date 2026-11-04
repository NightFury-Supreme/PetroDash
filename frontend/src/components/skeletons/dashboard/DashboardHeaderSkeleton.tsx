import React from "react";

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <div className="w-48 h-8 bg-[#202020] rounded animate-pulse mb-1" />
        <div className="w-64 h-4 bg-[#202020] rounded animate-pulse" />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-[105px] h-[30px] rounded-md bg-[#202020] animate-pulse" />
        <div className="w-[30px] h-[30px] rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
      </div>
    </div>
  );
}

export default DashboardHeaderSkeleton;
