"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import type { AdSenseSettings } from "./adTypes";
import { hasAdBlocker } from "./adUtils";

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

        const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/ads`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'default',
        });

        if (!response.ok) {
          throw new Error(`Failed to load settings: ${response.status}`);
        }

        let data: any = {}; try { data = await response.json(); } catch {}
        
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
