/* ==========================================================================
   RankBadge / RoleBadge Component
   Compliance: ISO/IEC 25010, Reusable Shared UI Pattern (<300 lines)
   Self-contained component with icons and Title Case role styling.
========================================================================== */

'use client';

import React from 'react';
import { User, Shield, Cpu } from 'lucide-react';

export type RankType = 'admin' | 'user' | 'system' | string;
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface RankBadgeProps {
  rank: RankType;
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export function RankBadge({
  rank,
  size = 'md',
  className = '',
  showIcon = true,
  children,
}: RankBadgeProps) {
  if (!rank && !children) return null;

  const normalizedRank = String(rank || '').toLowerCase();

  let colorClass = 'bg-white/5 text-white/40';
  let label = String(rank || '');
  label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  let IconComponent: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> = User;

  if (normalizedRank === 'admin' || normalizedRank === 'administrator') {
    colorClass = 'bg-[#FF5722]/10 text-[#FF5722]';
    label = 'Admin';
    IconComponent = Shield;
  } else if (normalizedRank === 'user') {
    colorClass = 'bg-[#00FF88]/10 text-[#00FF88]';
    label = 'User';
    IconComponent = User;
  } else if (normalizedRank === 'system') {
    colorClass = 'bg-white/5 text-white/40';
    label = 'System';
    IconComponent = Cpu;
  }

  const iconSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded font-normal whitespace-nowrap shrink-0 transition-colors ${sizeClass} ${colorClass} ${className}`.trim()}
    >
      {showIcon && <IconComponent size={iconSize} strokeWidth={1} className="shrink-0" />}
      <span>{children || label}</span>
    </span>
  );
}

export { RankBadge as RoleBadge };
export default RankBadge;
