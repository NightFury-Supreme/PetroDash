/* ==========================================================================
   Admin Server Edit Hook
   Compliance: ISO/IEC 25010, Separation of Concerns
========================================================================== */

import { useState, useCallback, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminServer, ServerLimits } from '@/components/admin/servers/types';

export function useAdminServerEdit(serverId: string, onUpdate?: () => void, onClose?: () => void) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [server, setServer] = useState<AdminServer | null>(null);
  const [limits, setLimits] = useState<ServerLimits>({
    diskMb: 0,
    memoryMb: 0,
    cpuPercent: 0,
    backups: 0,
    databases: 0,
    allocations: 0,
  });
  const [name, setName] = useState<string>('');

  const loadServer = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${serverId}`,
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
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadServer().catch(() => {});
  }, [loadServer]);

  const handleConfirmDelete = async () => {
    if (!server) return;
    setIsDeleting(true);
    setFailed(false);
    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${serverId}`,
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
    if (!server) return;
    setSaving(true);
    setFailed(false);
    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${serverId}`,
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
