import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Individual skeleton block for server cards - YouTube style
export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#202020] border border-[#303030] rounded-xl overflow-hidden ${className}`}>
      {/* Bottom metadata section */}
      <div className="p-4 space-y-3">
        {/* Circular placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#202020] rounded-full"></div>
          <div className="flex-1 space-y-2">
            {/* Title bar */}
            <div className="h-4 bg-[#202020] rounded"></div>
            {/* Secondary info bar */}
            <div className="h-3 bg-[#202020] rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}


