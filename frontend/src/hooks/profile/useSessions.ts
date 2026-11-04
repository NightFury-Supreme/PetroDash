"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { SessionItem } from './useProfile.types';

let sessionsMemoryCache: SessionItem[] | null = null;
let inFlightPromise: Promise<SessionItem[]> | null = null;

export function getCachedSessionsSync(): SessionItem[] | null {
  return sessionsMemoryCache;
}

export function updateCachedSessions(
  updater: (prev: SessionItem[]) => SessionItem[]
): void {
  if (sessionsMemoryCache) {
    sessionsMemoryCache = updater(sessionsMemoryCache);
  }
}

export function clearSessionsCache(): void {
  sessionsMemoryCache = null;
  inFlightPromise = null;
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionItem[]>(() => sessionsMemoryCache || []);
  const [loading, setLoading] = useState<boolean>(() => sessionsMemoryCache === null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchSessions = useCallback(async (force = false): Promise<SessionItem[]> => {
    if (!force && sessionsMemoryCache !== null) {
      if (mountedRef.current) {
        setSessions(sessionsMemoryCache);
        setLoading(false);
      }
      return sessionsMemoryCache;
    }

    if (inFlightPromise) {
      try {
        const result = await inFlightPromise;
        if (mountedRef.current) {
          setSessions(result);
          setLoading(false);
        }
        return result;
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'ERR_SESSIONS_FETCH_FAILED');
          setLoading(false);
        }
        return [];
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      if (mountedRef.current) {
        setSessions([]);
        setLoading(false);
      }
      return [];
    }

    if (sessionsMemoryCache === null && mountedRef.current) {
      setLoading(true);
    }
    setError(null);

    inFlightPromise = (async () => {
      try {
        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          const redirect = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
          return [];
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || body?.message || 'ERR_SESSIONS_FETCH_FAILED');
        }

        const data = await res.json();
        const sessionList: SessionItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.sessions)
          ? data.sessions
          : [];

        sessionsMemoryCache = sessionList;
        return sessionList;
      } finally {
        inFlightPromise = null;
      }
    })();

    try {
      const result = await inFlightPromise;
      if (mountedRef.current) {
        setSessions(result);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ERR_SESSIONS_FETCH_FAILED';
      if (mountedRef.current) {
        setError(message);
        if (!sessionsMemoryCache) {
          setSessions([]);
        }
      }
      return sessionsMemoryCache || [];
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const revokeSession = useCallback(async (id: string): Promise<void> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/sessions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || ''}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || data?.message || 'ERR_SESSION_REVOKED');
    }

    updateCachedSessions((prev) => prev.filter((s) => s.id !== id));
    if (mountedRef.current) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    revokeSession,
  };
}
