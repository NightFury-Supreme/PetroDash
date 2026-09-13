"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  Cpu,
  HardDrive,
  MemoryStick,
  Database,
  Network,
  ShieldAlert,
  WifiOff,
  ExternalLink,
  Trash2,
} from "lucide-react";
import React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";


type ServerLimits = {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
};

type AdminServer = {
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

interface AdminEditServerDrawerProps {
  serverId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

type ResourceFieldDef = {
  key: keyof ServerLimits;
  label: string;
  icon: React.ElementType;
  unit: string;
};

const RESOURCE_FIELDS: ResourceFieldDef[] = [
  { key: "cpuPercent", label: "CPU", icon: Cpu, unit: "%" },
  { key: "memoryMb", label: "Memory", icon: MemoryStick, unit: "MB" },
  { key: "diskMb", label: "Disk Storage", icon: HardDrive, unit: "MB" },
  { key: "backups", label: "Backups", icon: Save, unit: "" },
  { key: "databases", label: "Databases", icon: Database, unit: "" },
  { key: "allocations", label: "Allocations", icon: Network, unit: "" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function ResourceField({
  field,
  value,
  onChange,
}: {
  field: ResourceFieldDef;
  value: number;
  onChange: (key: keyof ServerLimits, val: number) => void;
}) {
  const Icon = field.icon;
  return (
    <div className="relative group">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#D4D4D4]">
          <Icon size={14} className="text-[#888]" />
          {field.label}
        </span>
      </div>
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value === 0 && !value.toString() ? '' : value}
          onChange={(e) =>
            onChange(field.key, e.target.value === '' ? 0 : parseInt(e.target.value, 10))
          }
          className="w-full rounded-lg border bg-[#161616] pl-4 pr-16 py-2.5 text-sm text-[#D4D4D4] outline-none transition-colors border-[#222] focus:border-[#FF5722]/60"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {field.unit && (
            <span className="pointer-events-none text-xs text-[#888] font-medium mr-1">
              {field.unit}
            </span>
          )}
          <div className="flex flex-col border-l border-[#222] pl-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => onChange(field.key, (value || 0) + 1)}
              className="text-[#888] hover:text-[#D4D4D4] transition-colors"
            >
              <ChevronUp size={12} strokeWidth={3} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={() =>
                onChange(field.key, Math.max(0, (value || 0) - 1))
              }
              className="text-[#888] hover:text-[#D4D4D4] transition-colors -mt-[1px]"
            >
              <ChevronDown size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full animate-in fade-in duration-300">
      <section>
        <div className="h-6 w-32 rounded bg-[#161616] animate-pulse" />
        <div className="mt-1.5 h-4 w-64 rounded bg-[#161616] animate-pulse" />

        <div className="mb-2 mt-6 h-4 w-24 rounded bg-[#161616] animate-pulse" />
        <div className="h-[42px] w-full rounded-lg border border-[#222] bg-[#161616] animate-pulse" />
      </section>

      <section className="mt-8">
        <div className="h-6 w-32 rounded bg-[#161616] animate-pulse" />
        <div className="mt-1 h-4 w-56 rounded bg-[#161616] animate-pulse" />

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative group">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded bg-[#161616] animate-pulse" />
                  <div className="h-4 w-20 rounded bg-[#161616] animate-pulse" />
                </div>
              </div>
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-[#161616] animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Main Drawer ─────────────────────────────────────────────────────────────

export function AdminEditServerDrawer({
  serverId,
  onClose,
  onUpdate,
}: AdminEditServerDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);

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
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete server");
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
      setIsDeleting(false);
      throw err;
    }
  };
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
      setErrorMsg(err.message || "Failed to load server");
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadServer();
  }, [loadServer]);

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
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update server");
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const isSuspended =
    server?.suspended || server?.status?.toLowerCase() === "suspended";
  const isUnreachable =
    server?.unreachable || server?.status?.toLowerCase() === "unreachable";



  const headerExtra = server ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#161616] px-2.5 py-1 text-xs text-[#888]">
        {server.location.flag && (
          <img 
            src={server.location.flag.startsWith('http') 
              ? server.location.flag 
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.location.flag.startsWith('/') ? '' : '/'}${server.location.flag}`}
            alt="Node flag" 
            className="w-3.5 h-3 object-cover rounded-[2px]"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {server.location.name}
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#161616] px-2.5 py-1 text-xs text-[#888]">
        {server.egg.icon && (
          <img 
            src={server.egg.icon.startsWith('http') 
              ? server.egg.icon 
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.egg.icon.startsWith('/') ? '' : '/'}${server.egg.icon}`}
            alt="Egg icon" 
            className="w-3.5 h-3.5 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {server.egg.name}
      </span>
    </div>
  ) : null;

  const canEdit = !isSuspended && !isUnreachable;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={loading ? "Edit Server" : (server?.name ?? "Edit Server")}
      subtitle={server?.uuid ? `UUID: ${server.uuid.split('-')[0]}...` : 'Update configuration'}
      icon={<Server className="text-[#D4D4D4]" size={22} />}
      headerExtra={headerExtra}
      footer={
        !loading && server ? (
          <div className="flex items-center justify-between w-full">
            {/* Left side actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteDrawer(true)}
                disabled={isDeleting || isSuspended || server?.status?.toLowerCase() === "creating"}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isDeleting || isSuspended || server?.status?.toLowerCase() === "creating"
                    ? "border-[#222] bg-[#161616] text-[#555] cursor-not-allowed"
                    : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                }`}
                title={isSuspended ? "Cannot delete suspended server" : "Delete server"}
              >
                {isDeleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span className="hidden sm:inline">Delete</span>
              </button>
              
              {!isUnreachable && server.clientUrl ? (
                <a
                  href={server.clientUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
                  title="Open server in Pterodactyl"
                >
                  <ExternalLink size={15} />
                  <span className="hidden sm:inline">Open Panel</span>
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 rounded-lg border border-[#222] bg-[#161616] px-4 py-2 text-sm font-medium text-[#555] cursor-not-allowed"
                  title="Cannot open unreachable server"
                >
                  <ExternalLink size={15} />
                  <span className="hidden sm:inline">Open Panel</span>
                </button>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || saved || failed}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
              >
                Cancel
              </button>
              {canEdit && (
                <button
                  onClick={handleSave}
                  disabled={saving || saved || failed || !name.trim() || server?.status?.toLowerCase() === "creating"}
                  className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                    saved
                      ? "bg-emerald-500 border border-emerald-500 text-white cursor-default"
                      : failed
                      ? "bg-red-500 border border-red-500 text-white cursor-default"
                      : saving || !name.trim() || server?.status?.toLowerCase() === "creating"
                      ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                      : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
                  }`}
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : saved ? (
                    "Saved!"
                  ) : failed ? (
                    "Failed to Save"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              )}
            </div>
          </div>
) : null
      }
    >
      {loading ? (
        <DrawerSkeleton />
      ) : errorMsg && !server ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-sm font-medium text-[#D4D4D4]">{errorMsg}</p>
          <button onClick={loadServer} className="text-xs text-[#FF5722] hover:underline mt-2">
            Try again
          </button>
        </div>
      ) : isSuspended ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#D4D4D4]">Server Suspended</p>
              <p className="text-xs text-[#888] mt-1 max-w-[280px]">
                This server is currently suspended. Unsuspend it from the panel before editing its limits.
              </p>
            </div>
          </div>
        </div>
      ) : isUnreachable ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <WifiOff size={24} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#D4D4D4]">Server Unreachable</p>
              <p className="text-xs text-[#888] mt-1 max-w-[280px]">
                Cannot connect to the panel for this server. Limits cannot be edited while the server is unreachable.
              </p>
            </div>
          </div>
        </div>
      ) : server ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-base font-semibold text-white">Server Details</h2>
            <p className="mt-0.5 text-sm text-[#888]">Configure your server&apos;s basic information</p>

            <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
              Server Name <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter server name"
              className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
            />
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-base font-semibold text-white">Resource Limits</h2>
            </div>
            <p className="text-sm text-[#888]">Configure your server&apos;s resource allocation</p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {RESOURCE_FIELDS.map((field) => (
                <ResourceField
                  key={field.key}
                  field={field}
                  value={limits[field.key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* Delete Server Drawer */}
      <DeleteDrawer
        isOpen={showDeleteDrawer}
        onClose={() => setShowDeleteDrawer(false)}
        onConfirm={handleConfirmDelete}
        entityType="Server"
        entityName={server?.name || ""}
        warningPoints={[
          "The server will be permanently deleted from the panel.",
          "All associated data and configurations will be lost.",
          "This action cannot be undone.",
        ]}
      />
    </Drawer>
  );
}
