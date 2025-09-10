"use client";

import React from "react";

export default function TicketListSkeleton({ count=5 }:{ count?: number }){
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-[#303030] rounded-xl p-4 bg-[#181818]">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-1/3 bg-[#262626] rounded mb-2 animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-[#262626] rounded animate-pulse" />
                <div className="h-5 w-20 bg-[#262626] rounded animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-24 bg-[#262626] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}


