"use client";

import React from "react";

export default function TicketDetailSkeleton(){
  return (
    <div className="pb-28 px-2 space-y-3 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
      {Array.from({ length: 8 }).map((_, i) => {
        const isMine = i % 2 === 0;
        return (
          <div key={i} className={`flex w-full min-w-0 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] min-w-0 flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`mb-1.5 flex items-center gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
              <div className={`rounded-2xl px-4 py-3 min-w-0 max-w-full ${isMine ? 'rounded-tr-sm bg-[#151515] border border-[#282828]' : 'rounded-tl-sm bg-[#121212] border border-[#282828]'}`}>
                <div className="h-4 w-56 bg-white/5 rounded mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
              </div>
              <div className={`mt-1.5 flex items-center gap-2 ${isMine ? 'justify-end' : ''}`}>
                <div className="h-3 w-12 bg-white/5 rounded animate-pulse shrink-0" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


