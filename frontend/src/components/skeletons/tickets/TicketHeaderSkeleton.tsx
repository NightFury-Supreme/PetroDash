"use client";

import React from "react";

export default function TicketHeaderSkeleton({ contentPadding }:{ contentPadding: number }){
  return (
    <div className="fixed top-0 right-0 z-40" style={{ left: contentPadding }}>
      <div className="h-20 px-6 flex items-center justify-between border-b border-[#303030] bg-[#0f0f0f]/80 backdrop-blur">
        <div className="flex items-center gap-4 w-full">
          <div className="w-10 h-10 rounded-xl border border-[#303030]" />
          <div className="w-12 h-12 bg-[#202020] border border-[#303030] rounded-2xl" />
          <div className="flex-1">
            <div className="h-5 w-48 bg-[#262626] rounded mb-2 animate-pulse" />
            <div className="h-3 w-32 bg-[#262626] rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-xl border border-[#303030]" />
        </div>
      </div>
    </div>
  );
}


