'use client';

import React from 'react';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
      {children}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-[#555] mt-2 font-mono">
      {children}
    </p>
  );
}
