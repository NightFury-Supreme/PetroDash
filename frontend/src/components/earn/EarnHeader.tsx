import React from 'react';

export function EarnHeader() {
  return (
    <header>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FF5722]">Earn</h1>
          <p className="mt-1 text-sm text-white/40">
            Watch rewarded videos and complete tasks to earn coins.
          </p>
        </div>
      </div>
    </header>
  );
}
