"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { AdBlockerModal } from './AdBlockerModal';
import type { AdSenseProps, AdSenseSettings } from './adTypes';
import {
  validatePublisherId,
  sanitizeAdSlot,
  hasAdBlocker,
  useIntersectionObserver,
  isAdSenseConfigured,
} from './adUtils';
import {
  useAdSenseSettings,
  useAdSensePerformance,
  useAdBlockerDetection,
  useAdSenseAnalytics,
} from './useAdSenseHooks';

export type { AdSenseProps, AdSenseSettings };
export { isAdSenseConfigured };
export {
  useAdSenseSettings,
  useAdSensePerformance,
  useAdBlockerDetection,
  useAdSenseAnalytics,
};
export {
  HeaderAd,
  SidebarAd,
  FooterAd,
  ContentAd,
  MobileAd,
} from './AdPlacements';

let scriptLoading = false;
let scriptLoaded = false;

export function AdSense({
  // eslint-disable-next-line unused-imports/no-unused-vars
  publisherId,
  // eslint-disable-next-line unused-imports/no-unused-vars
  adSlot,
  adFormat = 'auto',
  adStyle = { display: 'block' },
  className = '',
  position = 'content',
  lazyLoad = true,
  respectUserPrivacy = true
}: AdSenseProps) {
  const { settings, error: settingsError } = useAdSenseSettings();
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [, setIsLoading] = useState(false);
  const [showAdBlockerModal, setShowAdBlockerModal] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(adRef as React.RefObject<HTMLElement>, { threshold: 0.1 });

  useEffect(() => {
    if (settingsError) {
      setHasError(true);
    }
  }, [settingsError]);

  const loadAdSenseScript = useCallback(async (pubId: string) => {
    if (scriptLoaded || scriptLoading) {
      return Promise.resolve();
    }

    scriptLoading = true;

    return new Promise<void>((resolve, reject) => {
      if (!validatePublisherId(pubId)) {
        reject(new Error('Invalid publisher ID format'));
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pubId)}`;
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

  const initializeAd = useCallback(async (pubId: string, slotId: string) => {
    try {
      setIsLoading(true);
      setHasError(false);

      if (respectUserPrivacy) {
        const blocked = await hasAdBlocker();
        if (blocked) {
          setAdBlockerDetected(true);
          setShowAdBlockerModal(true);
          setIsLoading(false);
          return;
        }
      }

      try {
        await loadAdSenseScript(pubId);
      } catch (scriptError) {
        throw scriptError;
      }

      if ((window as any).adsbygoogle) {
        ((window as any).adsbygoogle as any).push({});
        setIsLoaded(true);
      } else {
        const blocked = await hasAdBlocker();
        if (blocked) {
          setAdBlockerDetected(true);
          setShowAdBlockerModal(true);
        } else {
          throw new Error('AdSense library failed to load');
        }
      }
    } catch (error) {
      console.error(`Failed to initialize AdSense ad for slot ${slotId}:`, error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [respectUserPrivacy, loadAdSenseScript]);

  const handleAdBlockerClose = useCallback(() => {
    setShowAdBlockerModal(false);
  }, []);

  const handleAdBlockerRetry = useCallback(async () => {
    setShowAdBlockerModal(false);
    setAdBlockerDetected(false);
    setHasError(false);
    
    if (settings) {
      const slotKey = position as keyof AdSenseSettings['adSlots'];
      const slotId = sanitizeAdSlot(settings.adSlots[slotKey]);
      const pubId = settings.publisherId;

      if (pubId && slotId) {
        await initializeAd(pubId, slotId);
      }
    }
  }, [settings, position, initializeAd]);

  useEffect(() => {
    if (!settings) return;

    if (!settings.enabled) {
      setShouldShow(false);
      return;
    }

    if (!validatePublisherId(settings.publisherId)) {
      setShouldShow(false);
      return;
    }

    const slotKey = position as keyof AdSenseSettings['adSlots'];
    const slotConfigured = settings.adSlots[slotKey] && sanitizeAdSlot(settings.adSlots[slotKey]) !== '';

    if (!slotConfigured) {
      setShouldShow(false);
      return;
    }

    setShouldShow(true);
  }, [settings, position]);

  useEffect(() => {
    if (!shouldShow || !settings || isLoaded || hasError) return;

    if (lazyLoad && !isIntersecting) return;

    const slotKey = position as keyof AdSenseSettings['adSlots'];
    const adSlotId = sanitizeAdSlot(settings.adSlots[slotKey]);
    const pubId = settings.publisherId;

    if (pubId && adSlotId) {
      initializeAd(pubId, adSlotId);
    }
  }, [shouldShow, settings, isIntersecting, isLoaded, hasError, lazyLoad, position, initializeAd]);

  if (!shouldShow || !settings || hasError) {
    return null;
  }

  const slotKey = position as keyof AdSenseSettings['adSlots'];
  const actualPublisherId = settings.publisherId;
  const actualAdSlot = sanitizeAdSlot(settings.adSlots[slotKey]);

  if (!actualPublisherId || !actualAdSlot) {
    return null;
  }

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
