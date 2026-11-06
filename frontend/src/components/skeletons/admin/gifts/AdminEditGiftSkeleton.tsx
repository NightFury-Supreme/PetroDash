import React from 'react';

export default function AdminEditGiftSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-3 w-16 bg-[#222] rounded" />
          </div>
          <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
        </div>

        <div className="col-span-2">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-3 w-24 bg-[#222] rounded" />
          </div>
          <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-3 w-24 bg-[#222] rounded" />
          </div>
          <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-3 w-16 bg-[#222] rounded" />
          </div>
          <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-3 w-20 bg-[#222] rounded" />
          </div>
          <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
          <div className="h-2.5 w-32 bg-[#222] rounded mt-1" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-3 w-20 bg-[#222] rounded" />
          </div>
          <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
          <div className="h-2.5 w-32 bg-[#222] rounded mt-1" />
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      <div>
        <div className="h-4 w-20 bg-[#2a2a2a] rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-3 w-16 bg-[#222] rounded" />
            </div>
            <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
          </div>

          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-3 w-20 bg-[#222] rounded" />
              </div>
              <div className="h-[42px] w-full bg-[#141414] rounded-lg border border-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
