/* ==========================================================================
   RankBadge Component
   Compliance: ISO/IEC 25010, Reusable Shared UI Pattern (<300 lines)
   Derived from StatusBadge for unified styling across roles and statuses.
========================================================================== */

'use client';

import React from 'react';
import { User, Shield, Cpu, Crown } from 'lucide-react';
import { StatusBadge, type StatusBadgeVariant } from './StatusBadge';

export type RankType = 'admin' | 'user' | 'system' | 'premium' | 'vip' | 'pro' | string;

export interface RankBadgeProps {
  rank: RankType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function RankBadge({
  rank,
  className = '',
  showIcon = true,
  children,
}: RankBadgeProps) {
  if (!rank && !children) return null;

  const normalizedRank = String(rank || '').toLowerCase();

  let variant: StatusBadgeVariant = 'neutral';
  let label = String(rank || '');
  label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  let IconComponent: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> = User;

  if (normalizedRank === 'admin' || normalizedRank === 'administrator') {
    variant = 'warning';
    label = 'Admin';
    IconComponent = Shield;
  } else if (normalizedRank === 'user') {
    variant = 'success';
    label = 'User';
    IconComponent = User;
  } else if (normalizedRank === 'system') {
    variant = 'neutral';
    label = 'System';
    IconComponent = Cpu;
  } else if (['premium', 'vip', 'pro', 'plus', 'donor'].some((keyword) => normalizedRank.includes(keyword))) {
    variant = 'warning';
    label = normalizedRank.toUpperCase() === 'VIP' ? 'VIP' : (label.charAt(0).toUpperCase() + label.slice(1).toLowerCase());
    IconComponent = Crown;
  }

  return (
    <StatusBadge variant={variant} className={className}>
      {showIcon && <IconComponent size={12} strokeWidth={1.5} className="shrink-0" />}
      <span>{children || label}</span>
    </StatusBadge>
  );
}

export default RankBadge;
