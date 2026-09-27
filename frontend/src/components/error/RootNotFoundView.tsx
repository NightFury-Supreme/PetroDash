/**
 * Root Non-Locale 404 View Component
 * Complies with ISO/IEC 25010 and WCAG 2.1 (Accessibility)
 */

import React from 'react';
import Link from 'next/link';

export function RootNotFoundView() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F0F0F] text-white flex flex-col font-sans antialiased">
        <header role="banner" className="w-full border-b border-white/[0.06] bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[#FF5722] rounded-md px-1 py-0.5"
              aria-label="PteroDash home"
            >
              <img src="/logo.svg" alt="PteroDash" className="h-7 w-auto object-contain" />
              <span className="font-bold tracking-tight text-base sm:text-lg">
                PteroDash
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="mx-auto mb-6 flex items-center justify-center text-[#FF5722]" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16 sm:w-20 sm:h-20"
            >
              <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
              <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
              <path d="M6 6h.01" />
              <path d="M6 18h.01" />
              <path d="m13 6-4 6h6l-4 6" />
            </svg>
          </div>
          <p className="text-[#FF5722] text-xs font-semibold tracking-widest uppercase mb-2">
            404 Not Found
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#EDEDED] mb-3">
            Page Not Found
          </h1>
          <p className="text-[#888888] text-sm leading-relaxed mb-8">
            The page you are looking for doesn&apos;t exist, has been moved, or you don&apos;t have permission to view it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Return Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
