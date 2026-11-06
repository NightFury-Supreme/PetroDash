import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminServer, ServerLimits } from '@/components/admin/servers/types';
import { clearAdminServersCache } from './useAdminServers';

interface CachedServerDetail {
  data: AdminServer;
  timestamp: number;
}

const serverDetailMemoryCache = new Map<string, CachedServerDetail>();

export function clearAdminServerDetailCache(id?: string) {
  if (id) {
    serverDetailMemoryCache.delete(id);
  } else {
    serverDetailMemoryCache.clear();
  }
}

export function useAdminServerEdit(serverId: string, onUpdate?: () => void, onClose?: () => void) {
  const resolvedServerId = Array.isArray(serverId) ? (serverId[0] || '') : (typeof serverId === 'string' ? serverId.trim() : '');

  const cachedInitial = resolvedServerId ? serverDetailMemoryCache.get(resolvedServerId) : undefined;

  const [loading, setLoading] = useState(() => Boolean(resolvedServerId && !cachedInitial));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [server, setServer] = useState<AdminServer | null>(() => cachedInitial?.data || null);
  const [limits, setLimits] = useState<ServerLimits>(() => cachedInitial?.data.limits ? { ...cachedInitial.data.limits } : {
    diskMb: 0,
    memoryMb: 0,
    cpuPercent: 0,
    backups: 0,
    databases: 0,
    allocations: 0,
  });
  const [name, setName] = useState<string>(() => cachedInitial?.data.name || '');

  const loadedServerIdRef = useRef<string | null>(null);

  const loadServer = useCallback(async (force = false) => {
    if (!resolvedServerId) {
      setLoading(false);
      return;
    }

    if (force) {
      serverDetailMemoryCache.delete(resolvedServerId);
      loadedServerIdRef.current = null;
    }

    const cached = serverDetailMemoryCache.get(resolvedServerId);
    if (!force && cached) {
      setServer(cached.data);
      setLimits({ ...cached.data.limits });
      setName(cached.data.name || '');
      setLoading(false);
      if (Date.now() - cached.timestamp < 30000) {
        loadedServerIdRef.current = resolvedServerId;
        return;
      }
    } else {
      setLoading(true);
    }

    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${resolvedServerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = errData?.error?.code || errData?.code || errData?.error || 'ERR_SERVER_NOT_FOUND';
        throw new Error(code);
      }
      const data: AdminServer = await res.json();
      setServer(data);
      setLimits({ ...data.limits });
      setName(data.name || '');
      serverDetailMemoryCache.set(resolvedServerId, { data, timestamp: Date.now() });
      loadedServerIdRef.current = resolvedServerId;
    } finally {
      setLoading(false);
    }
  }, [resolvedServerId]);

  useEffect(() => {
    if (!resolvedServerId) return;
    if (loadedServerIdRef.current === resolvedServerId) return;
    loadServer().catch(() => {});
  }, [resolvedServerId, loadServer]);

  const handleConfirmDelete = async () => {
    if (!server || !resolvedServerId) return;
    setIsDeleting(true);
    setFailed(false);
    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${resolvedServerId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = errData?.error?.code || errData?.code || errData?.error || 'ERR_PANEL_DELETION_FAILED';
        throw new Error(code);
      }
      serverDetailMemoryCache.delete(resolvedServerId);
      clearAdminServersCache();
      if (onUpdate) onUpdate();
      if (onClose) onClose();
    } catch (err: unknown) {
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
      setIsDeleting(false);
      throw err;
    }
  };

  const handleChange = useCallback(
    (key: keyof ServerLimits, val: number) => {
      setLimits((prev) => ({ ...prev, [key]: val }));
    },
    []
  );

  const handleSave = async () => {
    if (!server || !resolvedServerId) return;
    setSaving(true);
    setFailed(false);
    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${resolvedServerId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, limits }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = errData?.error?.code || errData?.code || errData?.error || 'ERR_PANEL_UPDATE_FAILED';
        throw new Error(code);
      }
      serverDetailMemoryCache.delete(resolvedServerId);
      clearAdminServersCache();
      setSaved(true);
      setTimeout(() => {
        if (onUpdate) onUpdate();
        if (onClose) onClose();
      }, 1000);
    } catch (err: unknown) {
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    server,
    name,
    setName,
    limits,
    loading,
    saving,
    saved,
    failed,
    isDeleting,
    errorMsg,
    setErrorMsg,
    setFailed,
    loadServer,
    handleChange,
    handleSave,
    handleConfirmDelete,
  };
}
