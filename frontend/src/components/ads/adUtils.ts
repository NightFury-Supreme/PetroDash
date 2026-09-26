import React, { useState, useEffect } from "react";
import type { AdSenseSettings } from "./adTypes";

// Security: Validate publisher ID format
export function validatePublisherId(publisherId: string): boolean {
  const publisherIdRegex = /^ca-pub-\d{10,16}$/;
  return publisherIdRegex.test(publisherId);
}

// Security: Sanitize ad slot ID
export function sanitizeAdSlot(adSlot: string): string {
  return adSlot.replace(/[^a-zA-Z0-9_\s-]/g, '').trim();
}

// Privacy: Check if user has ad blocking enabled
export function hasAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    const testScript = document.createElement('script');
    testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    testScript.onload = () => {
      document.head.removeChild(testScript);
      resolve(false);
    };
    testScript.onerror = () => {
      document.head.removeChild(testScript);
      resolve(true);
    };
    document.head.appendChild(testScript);
  });
}

// Performance: Intersection Observer for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Utility function to check if AdSense is properly configured
export function isAdSenseConfigured(settings: AdSenseSettings | null): boolean {
  if (!settings || !settings.enabled) return false;
  
  if (!validatePublisherId(settings.publisherId)) return false;
  
  const hasAnySlot = Object.values(settings.adSlots).some(slot => slot && slot.trim() !== '');
  return hasAnySlot;
}
