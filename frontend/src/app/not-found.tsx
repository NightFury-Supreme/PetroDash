"use client";

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 bg-[#0F0F0F] min-h-screen text-sans">
      <section className="text-center w-full max-w-[620px] px-4" aria-labelledby="error-title">
        <div className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]">
            <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>
            <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/>
            <path d="M6 6h.01"/>
            <path d="M6 18h.01"/>
            <path d="m13 6-4 6h6l-4 6"/>
          </svg>
        </div>
        <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
          404 Not Found
        </p>
        <h1 id="error-title" className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]">
          Page Not Found
        </h1>
        <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
          The page you are looking for doesn't exist, has been moved, or you don't have permission to view it.
        </p>
        <div className="mt-[29px] flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>
      </section>
    </div>
  );
}
