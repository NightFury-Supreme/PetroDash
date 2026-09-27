/* ==========================================================================
   Banned Page Skeleton Loading State
   Compliance: ISO/IEC 25010 (Performance, Usability), WCAG 2.1 (Accessibility)
========================================================================== */

'use client';

import React from 'react';
import { ErrorHeader } from '@/components/error';
import Footer from '@/components/Footer';

export function BannedSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading account restriction details..."
      aria-live="polite"
      className="flex flex-col w-full font-sans min-h-screen bg-[#0F0F0F] text-white justify-between"
    >
      <ErrorHeader />
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <section className="text-center w-full max-w-[620px] flex flex-col items-center">
          {/* Top Centered Icon Placeholder */}
          <div
            className="mx-auto mb-[24px] w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] rounded-full bg-[#1A1A1A] border border-white/[0.04] animate-pulse"
            aria-hidden="true"
          />

        {/* Kicker Placeholder */}
        <div className="mb-2.5 h-2.5 w-28 bg-[#1A1A1A] rounded animate-pulse" />

        {/* Title Placeholder */}
        <div className="mb-3.5 h-8 sm:h-10 w-64 bg-[#1A1A1A] rounded animate-pulse" />

        {/* Description Placeholder */}
        <div className="w-full max-w-[500px] flex flex-col items-center space-y-2.5 mt-2">
          {/* Greeting Placeholder */}
          <div className="h-4 w-36 bg-[#1A1A1A] rounded animate-pulse" />
          <div className="h-4 w-full max-w-[420px] bg-[#1A1A1A] rounded animate-pulse" />
          <div className="h-3.5 w-full max-w-[320px] bg-[#1A1A1A] rounded animate-pulse" />
          <div className="h-5 w-40 bg-[#1A1A1A] rounded animate-pulse" />
          <div className="h-3 w-56 bg-[#1A1A1A] rounded animate-pulse" />
        </div>

        {/* Action Buttons Placeholder */}
        <div className="mt-[29px] flex justify-center gap-3">
          <div className="h-[37px] w-28 bg-[#1A1A1A] rounded-md animate-pulse" />
          <div className="h-[37px] w-32 bg-[#1A1A1A] rounded-md animate-pulse" />
        </div>
      </section>
      </div>
      <Footer className="mt-auto" />
    </div>
  );
}

export default BannedSkeleton;
