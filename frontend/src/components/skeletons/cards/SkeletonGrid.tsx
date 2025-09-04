import React from 'react';
import { SkeletonCard } from './SkeletonCard';

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

// Grid of skeleton cards
export function SkeletonGrid({ count = 8, className = '' }: SkeletonGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}


