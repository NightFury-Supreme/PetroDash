import React from 'react';

type StatusType = 
  | 'active' | 'success' | 'online' | 'completed' | 'resolved' | 'enabled' | 'paid' | 'recommended'
  | 'inactive' | 'error' | 'offline' | 'banned' | 'suspended' | 'disabled' | 'closed' | 'failed'
  | 'pending' | 'warning' | 'starting' | 'installing' | 'processing' | 'open' | 'refunded' | 'expired'
  | 'neutral' | 'unknown' | 'system' | 'user' | 'info' | 'created' | 'voided';

interface StatusIndicatorProps {
  status: StatusType | string;
  label?: string; // Optional custom text to display instead of the default translated status
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<string, string> = {
  // Green
  active: 'text-[#00FF88]',
  success: 'text-[#00FF88]',
  online: 'text-[#00FF88]',
  completed: 'text-[#00FF88]',
  resolved: 'text-[#00FF88]',
  enabled: 'text-[#00FF88]',
  paid: 'text-[#00FF88]',
  recommended: 'text-[#00FF88]',
  
  // Red
  inactive: 'text-[#FF4444]',
  error: 'text-[#FF4444]',
  offline: 'text-[#FF4444]',
  banned: 'text-[#FF4444]',
  suspended: 'text-[#FF4444]',
  disabled: 'text-[#FF4444]',
  closed: 'text-[#FF4444]',
  failed: 'text-[#FF4444]',

  // Yellow/Orange
  pending: 'text-[#FFB020]',
  warning: 'text-[#FFB020]',
  starting: 'text-[#FFB020]',
  installing: 'text-[#FFB020]',
  processing: 'text-[#FFB020]',
  open: 'text-[#FFB020]',
  refunded: 'text-[#FFB020]',
  expired: 'text-[#FFB020]',

  // Blue
  info: 'text-[#4488FF]',
  created: 'text-[#4488FF]',

  // Gray/Neutral
  neutral: 'text-[#888888]',
  unknown: 'text-[#888888]',
  system: 'text-[#888888]',
  user: 'text-[#888888]',
  voided: 'text-[#888888]',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
  size = 'md',
}) => {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  const textColor = statusColors[normalizedStatus] || statusColors.unknown;
  const sizeClass = sizeStyles[size] || sizeStyles.md;
  
  // If label is not provided, we capitalize the status (for simple fallback if translation isn't passed in label)
  const displayText = label || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

  return (
    <span className={`font-medium ${sizeClass} ${textColor} ${className}`}>
      {displayText}
    </span>
  );
};

export default StatusIndicator;
