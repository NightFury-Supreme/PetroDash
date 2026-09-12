import React from 'react';

export type RankType = 'admin' | 'user' | 'system' | 'premium' | 'vip' | 'pro' | string;

export interface RankBadgeProps {
  rank: RankType;
  className?: string;
}

export function RankBadge({ rank, className = '' }: RankBadgeProps) {
  if (!rank) return null;
  
  const normalizedRank = String(rank).toLowerCase();
  
  let bgClass = 'bg-white/5';
  let textClass = 'text-white/40';
  let borderClass = 'border-white/[0.12]';
  let label = rank.toUpperCase();

  if (normalizedRank === 'admin' || normalizedRank === 'administrator') {
    bgClass = 'bg-[#FF5722]/10';
    textClass = 'text-[#FF5722]';
    borderClass = 'border-[#FF5722]/30';
    label = 'ADMIN';
  } else if (normalizedRank === 'user') {
    bgClass = 'bg-green-500/10';
    textClass = 'text-green-400';
    borderClass = 'border-green-500/30';
    label = 'USER';
  } else if (normalizedRank === 'system') {
    bgClass = 'bg-white/5';
    textClass = 'text-white/35';
    borderClass = 'border-white/[0.12]';
    label = 'SYSTEM';
  } else if (['premium', 'vip', 'pro', 'plus', 'donor'].some(keyword => normalizedRank.includes(keyword))) {
    // Catch-all for premium plans
    bgClass = 'bg-amber-500/10';
    textClass = 'text-amber-400';
    borderClass = 'border-amber-500/30';
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${bgClass} ${textClass} ${borderClass} ${className}`}
    >
      {label}
    </span>
  );
}
