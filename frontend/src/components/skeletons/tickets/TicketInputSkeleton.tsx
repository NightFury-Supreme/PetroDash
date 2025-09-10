"use client";

import React from "react";

export default function TicketInputSkeleton({ contentPadding }:{ contentPadding: number }){
  return (
    <div className="fixed right-0 bottom-0" style={{ left: contentPadding }}>
      <div className="p-3">
        <div className="flex items-end gap-2 bg-[#202020] border border-[#303030] rounded-full px-3 py-2">
          <div className="h-6 flex-1 bg-[#262626] rounded animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-[#262626] animate-pulse" />
        </div>
      </div>
    </div>
  );
}


