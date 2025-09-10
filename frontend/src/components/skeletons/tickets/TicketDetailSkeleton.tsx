"use client";

import React from "react";

export default function TicketDetailSkeleton(){
  return (
    <div className="pb-28 px-2 space-y-3 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`w-full flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className="max-w-[80%]">
            <div className="h-3 w-20 bg-[#262626] rounded mb-2 animate-pulse" />
            <div className="rounded-2xl px-4 py-3 border bg-[#1a1a1a] border-[#303030]">
              <div className="h-4 w-56 bg-[#262626] rounded mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-[#262626] rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


