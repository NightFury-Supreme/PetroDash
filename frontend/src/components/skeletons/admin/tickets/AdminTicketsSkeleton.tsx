"use client";

import React from "react";

export default function AdminTicketsSkeleton(){
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-[#303030] rounded-lg p-3">
          <div className="h-4 w-1/3 bg-[#262626] rounded mb-2 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-[#262626] rounded animate-pulse" />
            <div className="h-5 w-20 bg-[#262626] rounded animate-pulse" />
            <div className="h-4 w-28 bg-[#262626] rounded animate-pulse ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}


