"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { AdSenseProps, AdSenseSettings } from "./adTypes";
import {
  validatePublisherId,
  sanitizeAdSlot,
  hasAdBlocker,
  notifyAdBlockerDetected,
  useIntersectionObserver,
  isAdSenseConfigured,
} from "./adUtils";
import { useAppConfig } from "@/hooks/useAppConfig";
import {
  useAdSensePerformance,
  useAdBlockerDetection,
  useAdSenseAnalytics,
} from "./useAdSenseHooks";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type { AdSenseProps, AdSenseSettings };
export { isAdSenseConfigured };
export { useAdSensePerformance, useAdBlockerDetection, useAdSenseAnalytics };
export { HeaderAd, SidebarAd, FooterAd, ContentAd, MobileAd } from "./AdPlacements";

let scriptLoading = false;
let scriptLoaded = false;

const intersectionOptions = { threshold: 0.1 };

export function AdSense({
  publisherId: propPublisherId,
  adSlot: propAdSlot,
  adFormat = "auto",
  adStyle = { display: "block" },
  className = "",
  position = "content",
  lazyLoad = true,
  respectUserPrivacy = true,
}: AdSenseProps) {
  const { config } = useAppConfig();
  const settings = config.ads;
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(adRef as React.RefObject<HTMLElement>, intersectionOptions);

  const loadAdSenseScript = useCallback(async (pubId: string) => {
    if (scriptLoaded || scriptLoading) {
      return Promise.resolve();
    }

    scriptLoading = true;

    return new Promise<void>((resolve, reject) => {
      if (!validatePublisherId(pubId)) {
        reject(new Error("Invalid publisher ID format"));
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pubId)}`;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        scriptLoaded = true;
        scriptLoading = false;
        resolve();
      };
      script.onerror = () => {
        scriptLoading = false;
        reject(new Error("Failed to load AdSense script"));
      };

      document.head.appendChild(script);
    });
  }, []);

  const initializeAd = useCallback(async (pubId: string) => {
    try {
      setHasError(false);

      if (respectUserPrivacy) {
        const blocked = await hasAdBlocker();
        if (blocked) {
          setAdBlockerDetected(true);
          return;
        }
      }

      await loadAdSenseScript(pubId);

      const insEl = adRef.current?.querySelector("ins.adsbygoogle");
      if (insEl && (insEl.getAttribute("data-adsbygoogle-status") === "done" || insEl.childElementCount > 0)) {
        setIsLoaded(true);
        return;
      }

      if (window.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          setHasError(true);
          return;
        }

        setTimeout(() => {
          const el = adRef.current?.querySelector("ins.adsbygoogle");
          if (el) {
            const computed = window.getComputedStyle(el);
            const htmlEl = el as HTMLElement;
            const isHidden = computed.display === "none" || computed.visibility === "hidden" || htmlEl.offsetHeight === 0;

            if (isHidden) {
              setAdBlockerDetected(true);
              notifyAdBlockerDetected();
            } else {
              setIsLoaded(true);
            }
          }
        }, 1200);
      } else {
        setHasError(true);
      }
    } catch {
      if (respectUserPrivacy) {
        setAdBlockerDetected(true);
        notifyAdBlockerDetected();
      } else {
        setHasError(true);
      }
    }
  }, [respectUserPrivacy, loadAdSenseScript]);

  useEffect(() => {
    const pubId = propPublisherId || settings?.publisherId;
    if (!pubId || !validatePublisherId(pubId)) {
      setShouldShow(false);
      return;
    }

    if (settings && !settings.enabled && !propPublisherId) {
      setShouldShow(false);
      return;
    }

    const slotKey = position as keyof AdSenseSettings["adSlots"];
    const slotId = propAdSlot ? sanitizeAdSlot(propAdSlot) : (settings?.adSlots?.[slotKey] ? sanitizeAdSlot(settings.adSlots[slotKey]) : "");

    if (!slotId) {
      setShouldShow(false);
      return;
    }

    setShouldShow(true);
  }, [settings, position, propPublisherId, propAdSlot]);

  useEffect(() => {
    if (!shouldShow || isLoaded || hasError || adBlockerDetected) return;
    if (lazyLoad && !isIntersecting) return;

    const slotKey = position as keyof AdSenseSettings["adSlots"];
    const pubId = propPublisherId || settings?.publisherId;
    const adSlotId = propAdSlot ? sanitizeAdSlot(propAdSlot) : (settings?.adSlots?.[slotKey] ? sanitizeAdSlot(settings.adSlots[slotKey]) : "");

    if (pubId && adSlotId) {
      initializeAd(pubId);
    }
  }, [shouldShow, settings, isIntersecting, isLoaded, hasError, adBlockerDetected, lazyLoad, position, propPublisherId, propAdSlot, initializeAd]);

  if (adBlockerDetected || !shouldShow || hasError) {
    return null;
  }

  const slotKey = position as keyof AdSenseSettings["adSlots"];
  const actualPublisherId = propPublisherId || settings?.publisherId;
  const actualAdSlot = propAdSlot ? sanitizeAdSlot(propAdSlot) : (settings?.adSlots?.[slotKey] ? sanitizeAdSlot(settings.adSlots[slotKey]) : "");

  if (!actualPublisherId || !actualAdSlot) {
    return null;
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
          display: "block",
          minHeight: adStyle.minHeight || adStyle.height || "90px",
        }}
        data-ad-client={actualPublisherId}
        data-ad-slot={actualAdSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        data-ad-status="unfilled"
        data-ad-type={
          settings?.adTypes
            ? Object.keys(settings.adTypes)
              .filter((key) => settings.adTypes![key as keyof typeof settings.adTypes])
              .join(",")
            : "display"
        }
      />
    </div>
  );
}
