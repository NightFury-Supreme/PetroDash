"use client";

import { useState } from "react";
import { ServerInfo } from "./types";
import { Cpu, CircuitBoard, HardDrive, ChevronsUpDown, ExternalLink, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useTranslations } from 'next-intl';

interface ServersSectionProps {
  servers: ServerInfo[];
  onDelete: (serverId: string, serverName: string) => void;
  onEdit?: (serverId: string) => void;
  deleting?: string | null;
}

export function ServersSection({ servers, onDelete, onEdit }: ServersSectionProps) {
  const t = useTranslations('Dashboard');
  const [deletingServer, setDeletingServer] = useState<ServerInfo | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingServer) return;
    await onDelete(deletingServer._id, deletingServer.name);
  };

  return (
    <section>
      <div className="mb-5 flex items-end justify-between pt-7 px-5">
        <div>
          <h2 className="text-base font-semibold text-white">{t('servers')}</h2>
          <p className="mt-1 text-xs text-[#888888]">
            {t('serversSubtitle')}
          </p>
        </div>
      </div>

      <div className="w-full">
        <div className="hidden gap-4 grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 xl:grid">
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('colServerName')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('colNode')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('colEgg')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('colStatus')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('cpu')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('memory')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('disk')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="text-right">{t('colAction')}</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {servers.length === 0 ? (
            <div className="text-center py-12 text-[#888] text-sm">
              {t('noServers')}
            </div>
          ) : (
            servers.map((server) => {
              let statusBadge = (
                <span className="inline-flex rounded border border-emerald-500/20 bg-emerald-500/[0.04] px-2 py-1 text-[10px] font-medium text-emerald-500">
                  Active
                </span>
              );

              if (server.suspended || server.status === 'suspended') {
                statusBadge = (
                  <span className="inline-flex rounded border border-orange-500/20 bg-orange-500/[0.04] px-2 py-1 text-[10px] font-medium text-orange-500">
                    Suspended
                  </span>
                );
              } else if (server.unreachable || server.status === 'unreachable' || server.status === 'error') {
                statusBadge = (
                  <span className="inline-flex rounded border border-red-500/20 bg-red-500/[0.04] px-2 py-1 text-[10px] font-medium text-red-500">
                    Unreachable
                  </span>
                );
              } else if (server.status === 'creating') {
                statusBadge = (
                  <span className="inline-flex rounded border border-blue-500/20 bg-blue-500/[0.04] px-2 py-1 text-[10px] font-medium text-blue-500">
                    Creating
                  </span>
                );
              } else if (server.status === 'queued') {
                statusBadge = (
                  <span className="inline-flex whitespace-nowrap rounded border border-purple-500/20 bg-purple-500/[0.04] px-2 py-1 text-[10px] font-medium text-purple-400">
                    {server.queuePosition ? `Queued (Position: ${server.queuePosition})` : 'Queued'}
                  </span>
                );
              }

              const regionName = server.location || t('unknown');
              const isDownOrUnreachable = server.unreachable || server.status?.toLowerCase() === 'unreachable' || server.status?.toLowerCase() === 'error';

              return (
                <div key={server._id} className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.015] xl:grid xl:grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px] xl:items-center text-sm">
                  <div className="min-w-0">
                    <div className="font-mono text-zinc-200 truncate font-medium">{server.name}</div>
                    <div className="font-mono text-[10px] text-zinc-500 truncate mt-0.5" title="Dashboard ID">{server._id}</div>
                  </div>

                  <div className="text-zinc-400 flex items-center gap-2 truncate">
                    {server.locationFlag && (
                      <img
                        src={server.locationFlag.startsWith('http')
                          ? server.locationFlag
                          : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.locationFlag.startsWith('/') ? '' : '/'}${server.locationFlag}`}
                        alt="Node flag"
                        className="w-4 h-3 object-cover rounded-sm opacity-80"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    {regionName}
                  </div>

                  <div className="text-zinc-400 flex items-center gap-2 truncate">
                    {server.eggIcon && (
                      <img
                        src={server.eggIcon.startsWith('http')
                          ? server.eggIcon
                          : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.eggIcon.startsWith('/') ? '' : '/'}${server.eggIcon}`}
                        alt="Egg icon"
                        className="w-4 h-4 object-contain opacity-80"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    {server.eggName || t('unknown')}
                  </div>

                  <div>{statusBadge}</div>

                  <div className="text-zinc-300">
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <Cpu size={12} className="text-zinc-500" />
                      {server.cpu}%
                    </div>
                  </div>

                  <div className="text-zinc-300">
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <CircuitBoard size={12} className="text-zinc-500" />
                      {server.memory} MB
                    </div>
                  </div>

                  <div className="text-zinc-300">
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <HardDrive size={12} className="text-zinc-500" />
                      {server.storage} MB
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2 xl:mt-0">
                    {server.status !== 'queued' && server.status !== 'error' && (
                      <>
                        {/* Open Server */}
                        {isDownOrUnreachable || server.status === 'creating' ? (
                          <button disabled className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/30 cursor-not-allowed transition-colors" title={server.status === 'creating' ? "Server is creating" : "Cannot open unreachable server"}>
                            <ExternalLink size={14} />
                          </button>
                        ) : (
                          <a href={server.url} target="_blank" rel="noreferrer" className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors" title={t('openServer')}>
                            <ExternalLink size={14} />
                          </a>
                        )}
                        
                        {/* Edit Server */}
                        {server.suspended || server.status?.toLowerCase() === 'suspended' ? (
                          <button disabled className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/30 cursor-not-allowed transition-colors" title={t('cannotEditSuspended')}>
                            <ShieldAlert size={14} />
                          </button>
                        ) : server.status?.toLowerCase() === 'creating' ? (
                          <button disabled className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/30 cursor-not-allowed transition-colors" title={t('cannotEditCreating')}>
                            <Edit2 size={14} />
                          </button>
                        ) : isDownOrUnreachable ? (
                          <button disabled className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/30 cursor-not-allowed transition-colors" title={t('cannotEditUnreachable')}>
                            <Edit2 size={14} />
                          </button>
                        ) : (
                          <button onClick={() => onEdit?.(server._id)} className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors" title={t('editServer')}>
                            <Edit2 size={14} />
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => setDeletingServer(server)}
                      disabled={server.suspended || server.status?.toLowerCase() === 'suspended' || server.status?.toLowerCase() === 'creating'}
                      className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={server.status?.toLowerCase() === 'creating' ? t('cannotDeleteCreating') : (server.suspended || server.status?.toLowerCase() === 'suspended' ? t('cannotDeleteSuspended') : t('deleteServer'))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Drawer */}
      <DeleteDrawer
        isOpen={!!deletingServer}
        onClose={() => setDeletingServer(null)}
        onConfirm={handleConfirmDelete}
        entityType={t('deleteDrawerEntity')}
        entityName={deletingServer?.name || ''}
        entitySubText={deletingServer ? `Node: ${deletingServer.location || t('unknown')}` : ''}
        warningPoints={
          deletingServer?.status === 'queued' || deletingServer?.status === 'error'
            ? [
                "This will remove the server from the queue permanently.",
                "You will need to recreate the server manually.",
                "This action cannot be undone."
              ]
            : [
                "The server will be permanently deleted from the panel.",
                "All associated data and configurations will be lost.",
                "This action cannot be undone."
              ]
        }
      />
    </section>
  );
}
