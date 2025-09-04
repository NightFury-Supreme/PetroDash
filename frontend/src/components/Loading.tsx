import React from 'react';

// Skeleton loading components only - no animations
export function SkeletonSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  return (
    <div className={`${sizeClasses[size]} bg-[#202020] rounded-full ${className}`}></div>
  );
}

export function SkeletonDots({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  return (
    <div className="flex space-x-1">
      <div className={`${sizeClasses.sm} bg-[#202020] rounded-full`}></div>
      <div className={`${sizeClasses.sm} bg-[#202020] rounded-full`}></div>
      <div className={`${sizeClasses.sm} bg-[#202020] rounded-full`}></div>
    </div>
  );
}

// Full page skeleton loading - YouTube style
export function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="w-72 bg-[#181818] border-r border-[#303030] h-screen">
          <div className="p-6 border-b border-[#303030]">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-[#202020] rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-[#202020] rounded w-32"></div>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-2">
            <div className="h-10 bg-[#202020] rounded w-full"></div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#202020] rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 bg-[#0F0F0F]">
          <div className="p-6 space-y-8">
            <div className="h-16 bg-[#202020] rounded w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-[#202020] rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-[#202020] rounded"></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-[#202020] rounded w-48"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-[#202020] rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
