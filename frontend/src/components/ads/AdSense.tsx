"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { AdBlockerModal } from './AdBlockerModal';

interface AdSenseProps {
  publisherId: string;
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adStyle?: {
    display?: 'block' | 'inline-block';
    width?: string;
    height?: string;
    minHeight?: string;
  };
  className?: string;
  position?: 'header' | 'sidebar' | 'footer' | 'content' | 'mobile';
  lazyLoad?: boolean;
  respectUserPrivacy?: boolean;
}

interface AdSenseSettings {
  enabled: boolean;
  publisherId: string;
  adSlots: {
    header: string;
    sidebar: string;
    footer: string;
    content: string;
    mobile: string;
  };
  adTypes: {
    display: boolean;
    text: boolean;
    link: boolean;
    inFeed: boolean;
    inArticle: boolean;
    matchedContent: boolean;
  };
}

// Global script loading state
let scriptLoading = false;
let scriptLoaded = false;

// Security: Validate publisher ID format
function validatePublisherId(publisherId: string): boolean {
  const publisherIdRegex = /^ca-pub-\d{10,16}$/;
  return publisherIdRegex.test(publisherId);
}

// Security: Sanitize ad slot ID
function sanitizeAdSlot(adSlot: string): string {
  return adSlot.replace(/[^a-zA-Z0-9_\s-]/g, '').trim();
}

// Performance: Debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Privacy: Check if user has ad blocking enabled
function hasAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    // Test script loading immediately - this is the most reliable method
    const testScript = document.createElement('script');
    testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    testScript.onload = () => {
      document.head.removeChild(testScript);
      resolve(false); // Script loaded successfully
    };
    testScript.onerror = () => {
      document.head.removeChild(testScript);
      resolve(true); // Script failed to load - ad blocker detected
    };
    document.head.appendChild(testScript);
  });
}

// Performance: Intersection Observer for lazy loading
function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}

export function AdSense({
  publisherId,
  adSlot,
  adFormat = 'auto',
  adStyle = { display: 'block' },
  className = '',
  position = 'content',
  lazyLoad = true,
  respectUserPrivacy = true
}: AdSenseProps) {
  const [settings, setSettings] = useState<AdSenseSettings | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdBlockerModal, setShowAdBlockerModal] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(adRef as React.RefObject<HTMLElement>, { threshold: 0.1 });

  // Load settings with error handling and caching
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/ads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'default',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && typeof data === 'object' && 'enabled' in data) {
        setSettings(data);
      } else {
        throw new Error('Invalid settings format');
      }
    } catch (error) {
      console.error('Failed to load AdSense settings:', error);
      setHasError(true);
    }
  }, []);

  // Load AdSense script safely
  const loadAdSenseScript = useCallback(async (publisherId: string) => {
    if (scriptLoaded || scriptLoading) {
      return Promise.resolve();
    }

    scriptLoading = true;

    return new Promise<void>((resolve, reject) => {
      if (!validatePublisherId(publisherId)) {
        reject(new Error('Invalid publisher ID format'));
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        scriptLoaded = true;
        scriptLoading = false;
        resolve();
      };
      script.onerror = () => {
        scriptLoading = false;
        reject(new Error('Failed to load AdSense script'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize ad with error handling
  const initializeAd = useCallback(async (publisherId: string, adSlot: string) => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Check for ad blocker first, before loading script
      if (respectUserPrivacy) {
        const blocked = await hasAdBlocker();
        if (blocked) {
          setAdBlockerDetected(true);
          setShowAdBlockerModal(true);
          setIsLoading(false);
          return;
        }
      }

      // Load script if not already loaded
      try {
        await loadAdSenseScript(publisherId);
      } catch (scriptError) {
        throw scriptError; // Re-throw to be caught by outer catch block
      }

      // Initialize ad
      if ((window as any).adsbygoogle) {
        ((window as any).adsbygoogle as any).push({});
        setIsLoaded(true);
      } else {
        // If adsbygoogle is not available, check for ad blocker again
        if (respectUserPrivacy) {
          const blocked = await hasAdBlocker();
          if (blocked) {
            setAdBlockerDetected(true);
            setShowAdBlockerModal(true);
            setIsLoading(false);
            return;
          }
        }
        setHasError(true);
      }
    } catch (error) {
      // Check if this is a script loading error (likely ad blocker)
      const isScriptError = error instanceof Error && 
        (error.message.includes('Failed to load AdSense script') ||
         error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
         error.message.includes('net::ERR_BLOCKED_BY_CLIENT'));
      
      // Always check for ad blocker on script errors or if privacy mode is enabled
      if (isScriptError || respectUserPrivacy) {
        const blocked = await hasAdBlocker();
        if (blocked || isScriptError) {
          setAdBlockerDetected(true);
          setShowAdBlockerModal(true);
          setIsLoading(false);
          return;
        }
      }
      
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [loadAdSenseScript, respectUserPrivacy, position]);

  // Handle ad blocker modal
  const handleAdBlockerRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleAdBlockerClose = useCallback(() => {
    setShowAdBlockerModal(false);
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Determine if ad should show
  useEffect(() => {
    if (!settings) {
      setShouldShow(false);
      return;
    }

    // If AdSense is disabled, don't show anything
    if (!settings.enabled) {
      setShouldShow(false);
      return;
    }

    // If publisher ID is invalid, don't show
    if (!validatePublisherId(settings.publisherId)) {
            setShouldShow(false);
      return;
    }

    const slotKey = position as keyof AdSenseSettings['adSlots'];
    const adSlotId = settings.adSlots[slotKey];
    
    // If ad slot is not configured, don't show
    if (!adSlotId || adSlotId.trim() === '') {
      setShouldShow(false);
      return;
    }

    // Only show if all conditions are met
    setShouldShow(true);
  }, [settings, position]);

  // Initialize ad when conditions are met
  useEffect(() => {
    if (!shouldShow || !settings || isLoaded || hasError) return;

    if (lazyLoad && !isIntersecting) return;

    const slotKey = position as keyof AdSenseSettings['adSlots'];
    const adSlotId = sanitizeAdSlot(settings.adSlots[slotKey]);
    const publisherId = settings.publisherId;

    if (publisherId && adSlotId) {
      initializeAd(publisherId, adSlotId);
    }
  }, [shouldShow, settings, isIntersecting, isLoaded, hasError, lazyLoad, position, initializeAd]);

  // Don't render if conditions aren't met
  if (!shouldShow || !settings || hasError) {
    return null; // Don't show fallback content when ads are disabled
  }

  const slotKey = position as keyof AdSenseSettings['adSlots'];
  const actualPublisherId = settings.publisherId;
  const actualAdSlot = sanitizeAdSlot(settings.adSlots[slotKey]);

  if (!actualPublisherId || !actualAdSlot) {
    return null; // Don't show fallback content when ads are not configured
  }

  // Show ad blocker message if detected
  if (adBlockerDetected) {
    return (
      <>
        <div className={`adsense-container ${className}`} style={adStyle}>
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4 text-center text-sm text-red-600 dark:text-red-400">
            <i className="fas fa-shield-alt mr-2"></i>
            Ad blocker detected - Click to disable
            <button
              onClick={() => setShowAdBlockerModal(true)}
              className="ml-2 text-red-700 dark:text-red-300 hover:underline"
            >
              Learn how
            </button>
            <button
              onClick={handleAdBlockerRetry}
              className="ml-2 text-red-700 dark:text-red-300 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
        <AdBlockerModal
          isOpen={showAdBlockerModal}
          onClose={handleAdBlockerClose}
          onRetry={handleAdBlockerRetry}
        />
      </>
    );
  }

  return (
    <div 
      ref={adRef}
      className={`adsense-container ${className}`} 
      style={adStyle}
      data-ad-position={position}
      data-ad-loaded={isLoaded}
    >
      <ins
        className="adsbygoogle"
        style={{ 
          display: isLoaded ? 'block' : 'none',
          minHeight: adStyle.height || '90px'
        }}
        data-ad-client={actualPublisherId}
        data-ad-slot={actualAdSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        data-ad-status="unfilled"
        data-ad-type={settings.adTypes ? Object.keys(settings.adTypes).filter(key => settings.adTypes![key as keyof typeof settings.adTypes]).join(',') : 'display'}
      />
    </div>
  );
}

// Pre-configured ad components with improved settings
export function HeaderAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="horizontal"
      adStyle={{ display: 'block', width: '100%', minHeight: '90px' }}
      className="w-full mb-4"
      position="header"
      lazyLoad={false} // Header ads load immediately
      respectUserPrivacy={true}
    />
  );
}

export function SidebarAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="vertical"
      adStyle={{ display: 'block', width: '300px', minHeight: '600px' }}
      className="w-full"
      position="sidebar"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function FooterAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="horizontal"
      adStyle={{ display: 'block', width: '100%', minHeight: '90px' }}
      className="w-full mt-4"
      position="footer"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function ContentAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="rectangle"
      adStyle={{ display: 'block', width: '300px', minHeight: '250px' }}
      className="w-full my-4"
      position="content"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function MobileAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="auto"
      adStyle={{ display: 'block', width: '100%', minHeight: '50px' }}
      className="w-full my-4 md:hidden"
      position="mobile"
      lazyLoad={false} // Mobile ads load immediately for better UX
      respectUserPrivacy={true}
    />
  );
}

// Enhanced hook with caching and error handling
export function useAdSenseSettings() {
  const [settings, setSettings] = useState<AdSenseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/ads`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'default',
        });

        if (!response.ok) {
          throw new Error(`Failed to load settings: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && typeof data === 'object' && 'enabled' in data) {
          setSettings(data);
        } else {
          throw new Error('Invalid settings format');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Failed to load AdSense settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading, error };
}

// Utility function to check if AdSense is properly configured
export function isAdSenseConfigured(settings: AdSenseSettings | null): boolean {
  if (!settings || !settings.enabled) return false;
  
  if (!validatePublisherId(settings.publisherId)) return false;
  
  const hasAnySlot = Object.values(settings.adSlots).some(slot => slot && slot.trim() !== '');
  return hasAnySlot;
}

// Performance monitoring hook
export function useAdSensePerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    errorCount: 0,
    successCount: 0,
  });

  const recordLoadTime = useCallback((startTime: number) => {
    const loadTime = Date.now() - startTime;
    setMetrics(prev => ({ ...prev, loadTime }));
  }, []);

  const recordError = useCallback(() => {
    setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
  }, []);

  const recordSuccess = useCallback(() => {
    setMetrics(prev => ({ ...prev, successCount: prev.successCount + 1 }));
  }, []);

  return { metrics, recordLoadTime, recordError, recordSuccess };
}

// Ad blocker detection hook
export function useAdBlockerDetection() {
  const [isAdBlockerActive, setIsAdBlockerActive] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAdBlocker = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const blocked = await hasAdBlocker();
      setIsAdBlockerActive(blocked);
    } catch (error) {
      console.error('Failed to detect ad blocker:', error);
      setIsAdBlockerActive(null);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  useEffect(() => {
    checkAdBlocker();
  }, [checkAdBlocker]);

  return { isAdBlockerActive, isChecking, checkAdBlocker };
}

// AdSense analytics hook
export function useAdSenseAnalytics() {
  const [analytics, setAnalytics] = useState({
    impressions: 0,
    clicks: 0,
    revenue: 0,
    ctr: 0,
  });

  const trackImpression = useCallback(() => {
    setAnalytics(prev => ({ ...prev, impressions: prev.impressions + 1 }));
  }, []);

  const trackClick = useCallback(() => {
    setAnalytics(prev => ({ ...prev, clicks: prev.clicks + 1 }));
  }, []);

  const updateRevenue = useCallback((amount: number) => {
    setAnalytics(prev => ({ ...prev, revenue: prev.revenue + amount }));
  }, []);

  useEffect(() => {
    if (analytics.impressions > 0) {
      const ctr = (analytics.clicks / analytics.impressions) * 100;
      setAnalytics(prev => ({ ...prev, ctr }));
    }
  }, [analytics.clicks, analytics.impressions]);

  return { analytics, trackImpression, trackClick, updateRevenue };
}
