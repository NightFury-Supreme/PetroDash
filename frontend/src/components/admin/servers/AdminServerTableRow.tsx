import {
  Cpu,
  CircuitBoard,
  HardDrive,
  ExternalLink,
  Edit2,
  Trash2,
  ShieldAlert,
  User,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import React from "react";

type Server = {
  _id: string;
  clientUrl?: string;
  name: string;
  status: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    oauthProviders?: {
      discord?: { avatar?: string };
      google?: { picture?: string };
    };
  };
  egg: { _id: string; name: string; icon?: string };
  location: { _id: string; name: string; flag?: string };
  limits: {
    diskMb: number;
    memoryMb: number;
    cpuPercent: number;
    backups: number;
    databases: number;
    allocations: number;
  };
  createdAt: string;
  suspended?: boolean;
  unreachable?: boolean;
};

interface AdminServerTableRowProps {
  server: Server;
  onDelete: (serverId: string, serverName: string) => void;
  onEdit: (serverId: string) => void;
  deleting: string | null;
  hideOwner?: boolean;
}

export function AdminServerTableRow({
  server,
  onDelete,
  onEdit,
  deleting,
  hideOwner = false,
}: AdminServerTableRowProps) {
  let statusBadge: React.ReactNode = (
    <span className="px-2 py-1 rounded text-xs font-medium bg-[#00FF88]/10 text-[#00FF88]">
      Active
    </span>
  );

  if (server.suspended || server.status?.toLowerCase() === "suspended") {
    statusBadge = (
      <span className="px-2 py-1 rounded text-xs font-medium bg-[#FF5722]/10 text-[#FF5722]">
        Suspended
      </span>
    );
  } else if (
    server.unreachable ||
    server.status?.toLowerCase() === "unreachable"
  ) {
    statusBadge = (
      <span className="px-2 py-1 rounded text-xs font-medium bg-[#FF4444]/10 text-[#FF4444]">
        Unreachable
      </span>
    );
  } else if (server.status?.toLowerCase() === "error") {
    statusBadge = (
      <span className="px-2 py-1 whitespace-nowrap rounded text-xs font-medium bg-[#FF4444]/10 text-[#FF4444]">
        Failed
      </span>
    );
  } else if (server.status?.toLowerCase() === "creating") {
    statusBadge = (
      <span className="px-2 py-1 rounded text-xs font-medium bg-[#4488FF]/10 text-[#4488FF]">
        Creating
      </span>
    );
  } else if (server.status?.toLowerCase() === "queued") {
    statusBadge = (
      <span className="px-2 py-1 whitespace-nowrap rounded text-xs font-medium bg-[#A855F7]/10 text-[#A855F7]">
        Queued
      </span>
    );
  }

  const serverUrl = server.clientUrl || "#";
  const userAvatar =
    server.userId?.profilePicture ||
    server.userId?.oauthProviders?.discord?.avatar ||
    server.userId?.oauthProviders?.google?.picture;

  const isDownOrUnreachable =
    server.unreachable ||
    server.status?.toLowerCase() === "unreachable" ||
    server.status?.toLowerCase() === "error";

  const cols = hideOwner
    ? "lg:grid-cols-[1fr_1fr_1fr_100px_80px_100px_100px_120px]"
    : "lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_120px]";

  return (
    <div
      className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}
    >
      {/* Server Name */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          Server Name
        </p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">
          {server.name}
        </span>
        <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5" title="Dashboard ID">
          {server._id}
        </span>
      </div>

      {/* Owner */}
      {!hideOwner && (
        <div className="min-w-0">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
            Owner
          </p>
          <Link
            href={`/admin/users/${server.userId._id}`}
            className="flex items-center gap-2 group/link w-fit"
          >
            <div className="w-6 h-6 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center shrink-0 overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={10} className="text-[#666]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#D4D4D4] group-hover/link:text-[#FF5722] transition-colors truncate">
                {server.userId.username}
              </p>
              <p className="text-[10px] text-[#555] truncate">
                {server.userId.email}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Node */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          Node
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
          {server.location.flag && (
            <img
              src={
                server.location.flag.startsWith("http")
                  ? server.location.flag
                  : `${process.env.NEXT_PUBLIC_API_BASE || ""}${
                      server.location.flag.startsWith("/") ? "" : "/"
                    }${server.location.flag}`
              }
              alt="Node flag"
              className="w-5 h-4 object-cover rounded-[2px]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span className="truncate">{server.location.name}</span>
        </div>
      </div>

      {/* Egg */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          Egg
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
          {server.egg.icon && (
            <img
              src={
                server.egg.icon.startsWith("http")
                  ? server.egg.icon
                  : `${process.env.NEXT_PUBLIC_API_BASE || ""}${
                      server.egg.icon.startsWith("/") ? "" : "/"
                    }${server.egg.icon}`
              }
              alt="Egg icon"
              className="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span className="truncate">{server.egg.name}</span>
        </div>
      </div>

      {/* Status */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          Status
        </p>
        <div>{statusBadge}</div>
      </div>

      {/* CPU */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          CPU
        </p>
        <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
          <Cpu size={14} className="text-[#FF5722]" />
          <span className="truncate">{server.limits.cpuPercent}%</span>
        </div>
      </div>

      {/* RAM */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          RAM
        </p>
        <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
          <CircuitBoard size={14} className="text-[#FF5722]" />
          <span className="truncate">{server.limits.memoryMb.toLocaleString()} MB</span>
        </div>
      </div>

      {/* Disk */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          Disk
        </p>
        <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
          <HardDrive size={14} className="text-[#FF5722]" />
          <span className="truncate">{server.limits.diskMb.toLocaleString()} MB</span>
        </div>
      </div>

      {/* Actions */}
      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-2">
          {server.status !== 'queued' && server.status !== 'error' && (
            <>
              {/* Open server */}
              {isDownOrUnreachable ? (
                <button disabled className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#555] cursor-not-allowed transition-colors" title="Cannot open unreachable server">
                  <ExternalLink size={14} />
                </button>
              ) : (
                <a
                  href={serverUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent border border-[#222] rounded-lg"
                  title="Open server"
                >
                  <ExternalLink size={14} />
                </a>
              )}

              {/* Edit */}
              {server.suspended ||
              server.status?.toLowerCase() === "suspended" ? (
                <button
                  disabled
                  title="Cannot edit suspended server"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#555] cursor-not-allowed transition-colors"
                >
                  <ShieldAlert size={14} />
                </button>
              ) : server.status?.toLowerCase() === "creating" ? (
                <button
                  disabled
                  title="Cannot edit a server in this state"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#444] cursor-not-allowed transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              ) : isDownOrUnreachable ? (
                <button
                  disabled
                  title="Cannot edit unreachable server"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#555] cursor-not-allowed transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              ) : (
                <button
                  onClick={() => onEdit(server._id)}
                  title="Edit server"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent border border-[#222] rounded-lg"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </>
          )}

          {/* Delete */}
          <button
            onClick={() => onDelete(server._id, server.name)}
            disabled={
              deleting === server._id ||
              server.suspended ||
              server.status?.toLowerCase() === "suspended" ||
              server.status?.toLowerCase() === "creating"
            }
            title={
              server.status?.toLowerCase() === "creating" 
                ? "Cannot delete server while creating" 
                : server.suspended || server.status?.toLowerCase() === "suspended"
                ? "Cannot delete suspended server"
                : "Delete server"
            }
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#FF4444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting === server._id ? (
              <svg
                className="animate-spin"
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
