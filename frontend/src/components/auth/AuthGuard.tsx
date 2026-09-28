/* ==========================================================================
   AuthGuard Component
   Compliance: ISO/IEC 25010 (Single Responsibility Principle, <300 lines),
   OWASP ASVS v4.0 (Authentication & Access Control Gate)
========================================================================== */

'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/auth/useAuthGuard';

/**
 * Route protection gate for authenticated user layouts.
 *
 * Coordinates authentication state, optimistic validation rendering, and
 * redirect lifecycles across public and protected route segments.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isValidated, isPublic } = useAuthGuard();

  // Public segments and validated sessions render immediate children.
  if (isPublic || isValidated) {
    return <>{children}</>;
  }

  // Display minimal full-screen loading spinner while redirecting or resolving.
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]"
      aria-label="Loading"
      role="status"
    >
      <div
        className="h-10 w-10 rounded-full border-2 border-[#303030] border-t-white"
        style={{ animation: 'auth-spin 0.75s linear infinite' }}
      />
      <style>{`
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
