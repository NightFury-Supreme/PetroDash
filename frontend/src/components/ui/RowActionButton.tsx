/* ==========================================================================
   Row Action Button Component
   Compliance: ISO/IEC 25010, Reusable Shared UI Pattern (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Link } from '@/i18n/routing';

export type RowActionVariant = 'default' | 'danger' | 'success';

export interface RowActionButtonProps {
  variant?: RowActionVariant;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<RowActionVariant, string> = {
  default:
    'bg-transparent border border-white/10 rounded-md p-1.5 text-[#888] hover:bg-white/5 hover:border-white/20 hover:text-[#ddd] transition-colors',
  danger:
    'bg-transparent border border-red-500/30 rounded-md p-1.5 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  success:
    'bg-transparent border border-emerald-500/30 rounded-md p-1.5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
};

export function RowActionButton({
  variant = 'default',
  onClick,
  href,
  target,
  rel,
  disabled = false,
  title,
  children,
  className = '',
  type = 'button',
}: RowActionButtonProps) {
  const baseClasses = variantStyles[variant];
  const combinedClasses = `${baseClasses} ${className}`.trim();

  if (href && !disabled) {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return (
        <a
          href={href}
          target={target}
          rel={rel || (target === '_blank' ? 'noreferrer' : undefined)}
          className={combinedClasses}
          title={title}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={combinedClasses}
    >
      {children}
    </button>
  );
}

export default RowActionButton;
