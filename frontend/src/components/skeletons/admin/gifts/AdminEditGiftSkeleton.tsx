import React from 'react';

export default function AdminEditGiftSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <div className="h-3 w-16 bg-[#222] rounded"></div>
          <div className="h-[42px] w-full bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"></div>
        </div>
        <div className="col-span-2 space-y-2">
          <div className="h-3 w-24 bg-[#222] rounded"></div>
          <div className="h-[42px] w-full bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-[#222] rounded"></div>
          <div className="h-[42px] w-full bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-[#222] rounded"></div>
          <div className="h-[42px] w-full bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"></div>
        </div>
      </div>
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#333] to-transparent my-6"></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 bg-[#222] rounded"></div>
            <div className="h-[42px] w-full bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
