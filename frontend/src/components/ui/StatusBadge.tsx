/* ==========================================================================
   StatusBadge Component
   Compliance: ISO/IEC 25010, Reusable Shared UI Pattern (<300 lines)
========================================================================== */

'use client';

import React from 'react';

export type StatusBadgeVariant =
  | 'success' // green: active, user, online, resolved
  | 'danger'  // red: banned, failed, error, unreachable
  | 'warning' // orange: admin, suspended, pending
  | 'info'    // blue: creating, in_progress, open
  | 'purple'  // purple: queued, processing
  | 'neutral'; // gray: closed, system, unassigned, unknown

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
  children?: React.ReactNode;
  variant?: StatusBadgeVariant;
  status?: string;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: 'bg-[#00FF88]/10 text-[#00FF88]',
  danger: 'bg-[#FF4444]/10 text-[#FF4444]',
  warning: 'bg-[#FF5722]/10 text-[#FF5722]',
  info: 'bg-[#4488FF]/10 text-[#4488FF]',
  purple: 'bg-[#A855F7]/10 text-[#A855F7]',
  neutral: 'bg-white/5 text-white/40',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export function getStatusVariant(status?: string): StatusBadgeVariant {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (['active', 'user', 'online', 'enabled', 'resolved', 'success'].includes(s)) return 'success';
  if (['banned', 'ban', 'error', 'failed', 'unreachable', 'offline', 'disabled', 'danger'].includes(s)) return 'danger';
  if (['admin', 'administrator', 'suspended', 'warning', 'pending'].includes(s)) return 'warning';
  if (['creating', 'info', 'open', 'in_progress'].includes(s)) return 'info';
  if (['queued', 'purple', 'processing'].includes(s)) return 'purple';
  return 'neutral';
}

export function StatusBadge({
  children,
  variant,
  status,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const resolvedVariant = variant || (status ? getStatusVariant(status) : 'neutral');
  const sizeClass = sizeStyles[size] || sizeStyles.md;
  const baseClasses = `inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors ${sizeClass}`;
  const colorClasses = variantStyles[resolvedVariant] || variantStyles.neutral;

  return (
    <span className={`${baseClasses} ${colorClasses} ${className}`.trim()}>
      {children}
    </span>
  );
}

export default StatusBadge;
