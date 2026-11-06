"use client";

import { useEffect, useState, useCallback } from "react";
import { hasAdBlocker } from "./adUtils";
import { fetchAppConfig } from "@/utils/configCache";

export function invalidateAdSenseSettings() {
  fetchAppConfig(true).catch(() => { });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("adsense:refresh"));
  }
}

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

export function useAdBlockerDetection() {
  const [isAdBlockerActive, setIsAdBlockerActive] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAdBlocker = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const blocked = await hasAdBlocker();
      setIsAdBlockerActive(blocked);
    } catch {
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
