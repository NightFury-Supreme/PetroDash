"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminUserSession } from './types';

const sessionsMemoryCache = new Map<string, AdminUserSession[]>();
const inFlightPromises = new Map<string, Promise<AdminUserSession[]>>();

export function useAdminUserSessions(userId: string) {
  const [sessions, setSessions] = useState<AdminUserSession[]>(() => (userId ? sessionsMemoryCache.get(userId) || [] : []));
  const [loading, setLoading] = useState<boolean>(() => Boolean(userId && !sessionsMemoryCache.has(userId)));
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState<boolean>(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (userId) {
      if (sessionsMemoryCache.has(userId)) {
        setSessions(sessionsMemoryCache.get(userId)!);
        setLoading(false);
      } else {
        setSessions([]);
        setLoading(true);
      }
    }
  }, [userId]);

  const fetchSessions = useCallback(async (force = false): Promise<AdminUserSession[]> => {
    if (!userId) return [];

    if (!force && sessionsMemoryCache.has(userId)) {
      const cached = sessionsMemoryCache.get(userId)!;
      if (mountedRef.current) {
        setSessions(cached);
        setLoading(false);
      }
      return cached;
    }

    if (inFlightPromises.has(userId)) {
      try {
        const result = await inFlightPromises.get(userId)!;
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

    if (!sessionsMemoryCache.has(userId) && mountedRef.current) {
      setLoading(true);
    }
    setError(null);

    const promise = (async () => {
      try {
        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || body?.message || 'ERR_SESSIONS_FETCH_FAILED');
        }

        const data = await res.json();
        const sessionList: AdminUserSession[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.sessions)
          ? data.sessions
          : [];

        sessionsMemoryCache.set(userId, sessionList);
        return sessionList;
      } finally {
        inFlightPromises.delete(userId);
      }
    })();

    inFlightPromises.set(userId, promise);

    try {
      const result = await promise;
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
  }, [userId]);

  const revokeSession = useCallback(async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !sessionId) return { success: false, error: 'ERR_INVALID_PARAMS' };
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return { success: false, error: 'ERR_UNAUTHORIZED' };

    setRevokingId(sessionId);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || 'ERR_REVOKE_SESSION_FAILED');
      }

      const updated = (sessionsMemoryCache.get(userId) || []).filter((s) => s.id !== sessionId);
      sessionsMemoryCache.set(userId, updated);
      if (mountedRef.current) {
        setSessions(updated);
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ERR_REVOKE_SESSION_FAILED';
      return { success: false, error: msg };
    } finally {
      if (mountedRef.current) {
        setRevokingId(null);
      }
    }
  }, [userId]);

  const revokeAllSessions = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'ERR_INVALID_PARAMS' };
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return { success: false, error: 'ERR_UNAUTHORIZED' };

    setIsRevokingAll(true);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/sessions`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || 'ERR_REVOKE_ALL_SESSIONS_FAILED');
      }

      sessionsMemoryCache.set(userId, []);
      if (mountedRef.current) {
        setSessions([]);
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ERR_REVOKE_ALL_SESSIONS_FAILED';
      return { success: false, error: msg };
    } finally {
      if (mountedRef.current) {
        setIsRevokingAll(false);
      }
    }
  }, [userId]);

  return {
    sessions,
    loading,
    error,
    revokingId,
    isRevokingAll,
    fetchSessions,
    revokeSession,
    revokeAllSessions,
  };
}
