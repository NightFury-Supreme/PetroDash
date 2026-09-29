import React from 'react';

type StatusType = 
  | 'active' | 'success' | 'online' | 'completed' | 'resolved'
  | 'inactive' | 'error' | 'offline' | 'banned' | 'suspended' | 'disabled' | 'closed'
  | 'pending' | 'warning' | 'starting' | 'installing' | 'processing' | 'open'
  | 'neutral' | 'unknown' | 'system' | 'user' | 'info';

interface StatusIndicatorProps {
  status: StatusType | string;
  label?: string; // Optional custom text to display instead of the default translated status
  className?: string;
  size?: 'sm' | 'md' | 'lg'; // Kept for backwards compatibility, currently unused for styling
}

const statusColors: Record<string, string> = {
  // Green
  active: 'text-[#00FF88]',
  success: 'text-[#00FF88]',
  online: 'text-[#00FF88]',
  completed: 'text-[#00FF88]',
  resolved: 'text-[#00FF88]',
  
  // Red
  inactive: 'text-[#FF4444]',
  error: 'text-[#FF4444]',
  offline: 'text-[#FF4444]',
  banned: 'text-[#FF4444]',
  suspended: 'text-[#FF4444]',
  disabled: 'text-[#FF4444]',
  closed: 'text-[#FF4444]',

  // Yellow/Orange
  pending: 'text-[#FFB020]',
  warning: 'text-[#FFB020]',
  starting: 'text-[#FFB020]',
  installing: 'text-[#FFB020]',
  processing: 'text-[#FFB020]',
  open: 'text-[#FFB020]',

  // Blue
  info: 'text-[#4488FF]',

  // Gray/Neutral
  neutral: 'text-[#888888]',
  unknown: 'text-[#888888]',
  system: 'text-[#888888]',
  user: 'text-[#888888]',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
  size = 'md',
}) => {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  const textColor = statusColors[normalizedStatus] || statusColors.unknown;
  
  // If label is not provided, we capitalize the status (for simple fallback if translation isn't passed in label)
  const displayText = label || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

  return (
    <span className={`text-xs font-medium ${textColor} ${className}`}>
      {displayText}
    </span>
  );
};
