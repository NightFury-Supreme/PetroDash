'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';

export interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  username?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  rounded?: 'full' | 'lg' | 'md' | 'sm' | 'none';
  maxInitials?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-7 h-7 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-16 h-16 text-xl',
};

const ICON_SIZE_MAP: Record<string, number> = {
  xs: 10,
  sm: 11,
  md: 12,
  lg: 16,
  xl: 24,
};

const ROUNDED_MAP: Record<string, string> = {
  full: 'rounded-full',
  lg: 'rounded-lg',
  md: 'rounded-md',
  sm: 'rounded',
  none: 'rounded-none',
};

const DEFAULT_CDN_AVATAR = '/cdn/avatars/default.webp';

export function UserAvatar({
  src,
  alt = '',
  username,
  size = 'sm',
  rounded = 'full',
  maxInitials = 1,
  className = '',
  fallbackIcon,
}: UserAvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const cleanSrc = src && typeof src === 'string' && src.trim() ? src.trim() : null;

  useEffect(() => {
    setHasFailed(false);
    setCurrentSrc(cleanSrc || DEFAULT_CDN_AVATAR);
  }, [cleanSrc]);

  const handleError = () => {
    if (currentSrc && currentSrc !== DEFAULT_CDN_AVATAR) {
      setCurrentSrc(DEFAULT_CDN_AVATAR);
    } else {
      setHasFailed(true);
    }
  };

  const sizeClass = typeof size === 'string' ? (SIZE_MAP[size] || SIZE_MAP.sm) : '';
  const style = typeof size === 'number' ? { width: size, height: size, fontSize: size * 0.4 } : undefined;
  const iconSize = typeof size === 'string' ? (ICON_SIZE_MAP[size] || 12) : Math.round(size * 0.4);
  const roundedClass = ROUNDED_MAP[rounded] || ROUNDED_MAP.full;

  if (!currentSrc || hasFailed) {
    const initial = username ? username.trim().slice(0, maxInitials).toUpperCase() : null;
    return (
      <div
        style={style}
        className={`${roundedClass} bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center shrink-0 overflow-hidden font-semibold text-[#888] select-none ${sizeClass} ${className}`}
      >
        {initial ? (
          <span>{initial}</span>
        ) : (
          fallbackIcon || <UserIcon size={iconSize} className="text-[#666]" />
        )}
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`${roundedClass} flex items-center justify-center shrink-0 overflow-hidden ${sizeClass} ${className}`}
    >
      <img
        src={currentSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleError}
      />
    </div>
  );
}

export default UserAvatar;
