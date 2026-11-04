'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface NodeStatusItem {
  id: string;
  name: string;
  region: string;
  status: string;
  uptime: number;
  ping: number | null;
  history: Array<{
    date: string;
    status: string;
    uptime: number;
    downtimeMinutes: number;
  }>;
}

export interface SystemStatusData {
  globalUptime: number;
  panel: {
    status: string;
    uptime: number;
    ping: number | null;
    history: Array<{
      date: string;
      status: string;
      uptime: number;
      downtimeMinutes: number;
    }>;
  };
  nodes: NodeStatusItem[];
}

let memoryCache: SystemStatusData | null = null;
let inFlightPromise: Promise<SystemStatusData> | null = null;
const subscribers = new Set<(data: SystemStatusData) => void>();
let activeSubscribers = 0;
let sharedEventSource: EventSource | null = null;
let teardownTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 2000;

async function fetchInitialStatus(): Promise<SystemStatusData> {
  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/status`, { timeoutMs: 8000 });
      if (!res.ok) throw new Error('ERR_STATUS_FETCH_FAILED');
      const jsonData: SystemStatusData = await res.json();
      memoryCache = jsonData;
      subscribers.forEach((cb) => cb(jsonData));
      return jsonData;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

function startSharedStream() {
  if (sharedEventSource) return;

  const connect = () => {
    if (activeSubscribers === 0) return;

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const es = new EventSource(`${base}/api/status/stream`);
      sharedEventSource = es;

      let stabilityTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        reconnectDelay = 2000;
      }, 30000);

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.data && (payload.type === 'STATUS_UPDATED' || payload.type === 'STATUS_SNAPSHOT')) {
            memoryCache = payload.data;
            subscribers.forEach((cb) => cb(payload.data));
          }
        } catch {}
      };

      es.onerror = () => {
        if (stabilityTimer) {
          clearTimeout(stabilityTimer);
          stabilityTimer = null;
        }
        if (sharedEventSource === es) {
          es.close();
          sharedEventSource = null;

          if (activeSubscribers > 0 && !reconnectTimeout) {
            const jitter = Math.random() * 1000;
            reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connect();
            }, reconnectDelay + jitter);
          }
        }
      };
    } catch {
      if (activeSubscribers > 0 && !reconnectTimeout) {
        reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          connect();
        }, reconnectDelay);
      }
    }
  };

  connect();
}

function stopSharedStream() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (sharedEventSource) {
    sharedEventSource.close();
    sharedEventSource = null;
  }
}

export function useSystemStatus(_pollIntervalMs?: number) {
  const [data, setData] = useState<SystemStatusData | null>(memoryCache);
  const [loading, setLoading] = useState(!memoryCache);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!memoryCache) setLoading(true);
    try {
      const result = await fetchInitialStatus();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const msg = err instanceof Error ? err.message : 'ERR_STATUS_FETCH_FAILED';
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    activeSubscribers++;

    if (teardownTimeout) {
      clearTimeout(teardownTimeout);
      teardownTimeout = null;
    }

    const onStatusUpdate = (nextData: SystemStatusData) => {
      if (isMountedRef.current) {
        setData(nextData);
        setLoading(false);
        setError(null);
      }
    };

    subscribers.add(onStatusUpdate);

    if (!memoryCache) {
      refresh();
    }

    if (activeSubscribers === 1) {
      startSharedStream();
    }

    return () => {
      isMountedRef.current = false;
      subscribers.delete(onStatusUpdate);
      activeSubscribers--;
      if (activeSubscribers === 0) {
        teardownTimeout = setTimeout(() => {
          if (activeSubscribers === 0) {
            stopSharedStream();
          }
        }, 200);
      }
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
