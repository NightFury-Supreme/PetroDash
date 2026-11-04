import React, { useState, useEffect, useRef } from "react";
import type { AdSenseSettings } from "./adTypes";

export function validatePublisherId(publisherId: string): boolean {
  const publisherIdRegex = /^ca-pub-\d{10,16}$/;
  return publisherIdRegex.test(publisherId);
}

export function sanitizeAdSlot(adSlot: string): string {
  return adSlot.replace(/[^a-zA-Z0-9_\s-]/g, "").trim();
}

let cachedAdBlockerResult: boolean | null = null;
let adBlockerProbePromise: Promise<boolean> | null = null;

export function getCachedAdBlockerResult(): boolean | null {
  return cachedAdBlockerResult;
}

export function clearAdBlockerCache(): void {
  cachedAdBlockerResult = null;
  adBlockerProbePromise = null;
}

export function triggerAdBlockerScreen(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("adblocker:open"));
  }
}

export function notifyAdBlockerDetected(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("adblocker:detected"));
  }
}

function checkCosmeticBait(): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      const bait = document.createElement("div");
      bait.className = "adsbox pub_300x250 pub_728x90 ad-unit text-ad banner-ad";
      bait.id = "google_ads_iframe_bait";
      bait.style.cssText =
        "position:absolute!important;left:-9999px!important;top:-9999px!important;width:100px!important;height:100px!important;pointer-events:none;";
      bait.setAttribute("aria-hidden", "true");
      (document.body || document.documentElement).appendChild(bait);

      setTimeout(() => {
        let isHidden = false;
        try {
          const style = window.getComputedStyle(bait);
          isHidden =
            bait.offsetHeight === 0 ||
            bait.offsetWidth === 0 ||
            style.display === "none" ||
            style.visibility === "hidden";
        } catch {
          isHidden = false;
        }

        if (bait.parentNode) {
          bait.parentNode.removeChild(bait);
        }
        resolve(isHidden);
      }, 40);
    } catch {
      resolve(false);
    }
  });
}

export function hasAdBlocker(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return Promise.resolve(false);
  }

  if (cachedAdBlockerResult !== null) {
    return Promise.resolve(cachedAdBlockerResult);
  }

  if (adBlockerProbePromise) {
    return adBlockerProbePromise;
  }

  adBlockerProbePromise = (async (): Promise<boolean> => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        cachedAdBlockerResult = false;
        return false;
      }

      const networkPromise = (async (): Promise<boolean> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        try {
          await fetch(
            `https://googleads.g.doubleclick.net/pagead/id?_t=${Date.now()}`,
            {
              method: "HEAD",
              mode: "no-cors",
              cache: "no-store",
              signal: controller.signal,
            }
          );
          return false;
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === "AbortError") {
            return false;
          }
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            return false;
          }
          return true;
        } finally {
          clearTimeout(timeoutId);
        }
      })();

      const cosmeticPromise = checkCosmeticBait();

      const networkBlocked = await networkPromise;
      if (networkBlocked) {
        cachedAdBlockerResult = true;
        notifyAdBlockerDetected();
        return true;
      }

      const cosmeticBlocked = await cosmeticPromise;
      if (cosmeticBlocked) {
        cachedAdBlockerResult = true;
        notifyAdBlockerDetected();
        return true;
      }

      cachedAdBlockerResult = false;
      return false;
    } catch {
      cachedAdBlockerResult = false;
      return false;
    } finally {
      adBlockerProbePromise = null;
    }
  })();

  return adBlockerProbePromise;
}

if (typeof window !== "undefined") {
  hasAdBlocker();
}

export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, optionsRef.current);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef]);

  return isIntersecting;
}

export function isAdSenseConfigured(settings: AdSenseSettings | null): boolean {
  if (!settings || !settings.enabled) return false;
  if (!validatePublisherId(settings.publisherId)) return false;
  return Object.values(settings.adSlots).some((slot) => slot && slot.trim() !== "");
}
