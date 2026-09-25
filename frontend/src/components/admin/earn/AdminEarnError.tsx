/**
 * Admin Earn Error Component
 * Complies with ISO/IEC 25010
 */

'use client';

import { AlertTriangle } from 'lucide-react';

export interface AdminEarnErrorProps {
  error: string | null;
}

export function AdminEarnError({ error }: AdminEarnErrorProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 transition-all"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium text-red-400">{error}</span>
      </div>
    </div>
  );
}

