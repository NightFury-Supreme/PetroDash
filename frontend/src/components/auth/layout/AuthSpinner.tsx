import React from 'react';

export function AuthSpinner({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      className={`rounded-full border-2 border-[#303030] border-t-white animate-spin ${className}`}
      style={{ animationDuration: '0.75s' }}
      role="status"
    />
  );
}

export default AuthSpinner;
