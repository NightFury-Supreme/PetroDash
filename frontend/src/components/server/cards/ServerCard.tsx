"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  MapPin,
  Box,
  Cpu,
  HardDrive,
  Database,
  CircuitBoard,
  Archive,
  Network,
  Calendar,
  Ban,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";

export type ServerCardData = {
  _id: string;
  name: string;
  status: string;
  userId?: {
    _id: string;
    username: string;
    email: string;
  };
  egg: {
    _id: string;
    name: string;
  };
  location: {
    _id: string;
    name: string;
  };
  limits: {
    diskMb: number;
    memoryMb: number;
    cpuPercent: number;
    backups: number;
    databases: number;
    allocations: number;
  };
  createdAt: string;
  clientUrl?: string;
};

export interface ServerCardProps {
  server: ServerCardData;
  showOwner?: boolean;
  showActions?: boolean;
  onDelete?: (serverId: string, serverName: string) => void;
  deleting?: string | null;
  editLink?: string;
  viewOwnerLink?: string;
  className?: string;
}

export function ServerCard({
  server,
  showActions = true,
  onDelete,
  deleting,
  editLink,
  className = "",
}: ServerCardProps) {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");

  const isSuspended = server.status?.toLowerCase() === "suspended";

  return (
    <div
      className={`bg-[#202020] border border-[#303030] rounded-xl overflow-hidden hover:bg-[#272727] transition-all duration-300 ${className}`}
    >
      <div className="p-4 space-y-4">
        {/* Server name */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-white flex-1 pr-3 truncate">{server.name}</h3>
        </div>

        {/* Server info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
              <MapPin className="text-[#AAAAAA] w-3 h-3" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#AAAAAA]">{t("location")}</div>
              <div className="text-sm font-medium text-white truncate">{server.location.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
              <Box className="text-[#AAAAAA] w-3 h-3" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#AAAAAA]">{t("software")}</div>
              <div className="text-sm font-medium text-white truncate">{server.egg.name}</div>
            </div>
          </div>
        </div>

        {/* Resource usage */}
        <div className="space-y-3">
          <div className="text-xs text-[#AAAAAA] font-medium">{t("includedResources")}</div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
                  <Cpu className="text-[#AAAAAA] w-3 h-3" />
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">{t("cpu")}</div>
                <div className="text-sm font-medium text-white">{server.limits.cpuPercent}%</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
                  <HardDrive className="text-[#AAAAAA] w-3 h-3" />
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">{t("disk")}</div>
                <div className="text-sm font-medium text-white">{server.limits.diskMb} MB</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
                  <Database className="text-[#AAAAAA] w-3 h-3" />
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">{t("databases")}</div>
                <div className="text-sm font-medium text-white">{server.limits.databases}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
                  <CircuitBoard className="text-[#AAAAAA] w-3 h-3" />
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">{t("memory")}</div>
                <div className="text-sm font-medium text-white">{server.limits.memoryMb} MB</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
                  <Archive className="text-[#AAAAAA] w-3 h-3" />
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">{t("backups")}</div>
                <div className="text-sm font-medium text-white">{server.limits.backups}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center shrink-0">
                  <Network className="text-[#AAAAAA] w-3 h-3" />
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">{t("ports")}</div>
                <div className="text-sm font-medium text-white">{server.limits.allocations}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#303030]">
          <div className="text-xs text-[#AAAAAA] flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{tCommon("createdAt")}: {new Date(server.createdAt).toLocaleDateString()}</span>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              {isSuspended ? (
                <div className="text-center px-2 py-1 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-1">
                  <Ban className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 text-xs font-medium">{t("suspended")}</span>
                </div>
              ) : (
                <>
                  {server.clientUrl && (
                    <button
                      onClick={() => window.open(server.clientUrl, "_blank")}
                      className="bg-[#303030] hover:bg-[#404040] text-white p-1.5 text-xs rounded-lg transition-colors"
                      title={t("openInPanel")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {editLink && (
                    <Link
                      href={editLink}
                      className="bg-[#303030] hover:bg-[#404040] text-white p-1.5 text-xs rounded-lg transition-colors"
                      title={tCommon("edit")}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {onDelete && (
                    <button
                      onClick={() => onDelete(server._id, server.name)}
                      disabled={deleting === server._id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white p-1.5 text-xs rounded-lg transition-colors"
                      title={tCommon("delete")}
                    >
                      {deleting === server._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServerCard;
