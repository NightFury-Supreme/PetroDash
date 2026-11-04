'use client';

import React, { useState, useEffect } from 'react';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: React.ReactNode;
}

export function SafeImage({
  src,
  alt = '',
  fallback = null,
  className = '',
  onError,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = src && typeof src === 'string' && src.trim() ? src.trim() : null;

  if (!cleanSrc || hasError) {
    return <>{fallback}</>;
  }

  return (
    <img
      {...props}
      src={cleanSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        setHasError(true);
        if (onError) onError(e);
      }}
    />
  );
}

export default SafeImage;
