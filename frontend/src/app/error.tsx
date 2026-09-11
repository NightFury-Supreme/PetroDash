"use client";

import React, { useEffect } from 'react';
import { ErrorState, DashboardButton } from '@/components/ui/ErrorState';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  const msg = error.message && error.message !== 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.' 
    ? error.message 
    : "We encountered an unexpected issue while loading this page. Please try again or return to the dashboard.";

  return (
    <ErrorState
      fullScreen={false}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]">
          <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>
          <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/>
          <path d="M6 6h.01"/>
          <path d="M6 18h.01"/>
          <path d="m13 6-4 6h6l-4 6"/>
        </svg>
      }
      kicker="Application Error"
      title="Something went wrong"
      description={<p>{msg}</p>}
      buttons={
        <>
          <button 
            type="button" 
            onClick={() => reset()}
            className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[14px] h-[14px]">
              <path d="M20 11a8 8 0 0 0-14.7-4M4 5v4h4M4 13a8 8 0 0 0 14.7 4M20 19v-4h-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            Try Again
          </button>
          <DashboardButton variant="secondary" />
        </>
      }
    />
  );
}
