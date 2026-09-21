import { useState, useCallback, useEffect } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export type ServerLimits = {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
};

export type AdminServer = {
  _id: string;
  name: string;
  status: string;
  userId: { _id: string; username: string; email: string };
  egg: { _id: string; name: string; icon?: string };
  location: { _id: string; name: string; flag?: string };
  limits: ServerLimits;
  createdAt: string;
  unreachable?: boolean;
  suspended?: boolean;
  identifier?: string;
  uuid?: string;
  clientUrl?: string;
  panelUrl?: string;
};

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
  const [name, setName] = useState<string>("");

  const loadServer = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/servers/${serverId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load server");
      }
      const data: AdminServer = await res.json();
      setServer(data);
      setLimits({ ...data.limits });
      setName(data.name || "");
    } catch (err: any) {
      throw err; // handled by component
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadServer().catch((err) => {
       // This will be caught and set in the component
    });
  }, [loadServer]);

  const handleConfirmDelete = async () => {
    if (!server) return;
    setIsDeleting(true);
    setFailed(false);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/servers/${serverId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        let d: any = {};
        try { d = await res.json(); } catch {}
        throw new Error(d?.error || "Failed to delete server");
      }
      if (onUpdate) onUpdate();
      if (onClose) onClose();
    } catch (err: any) {
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
      const token = localStorage.getItem("auth_token");
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/servers/${serverId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, limits }),
        }
      );
      if (!res.ok) {
        let d: any = {};
        try { d = await res.json(); } catch {}
        throw new Error(d?.error || "Failed to update server");
      }
      setSaved(true);
      setTimeout(() => {
        if (onUpdate) onUpdate();
        if (onClose) onClose();
      }, 1000);
    } catch (err: any) {
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
