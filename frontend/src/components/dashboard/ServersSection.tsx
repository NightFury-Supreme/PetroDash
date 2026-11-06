"use client";

import { useState } from "react";
import { ServerInfo } from "./types";
import { Server, Cpu, CircuitBoard, HardDrive, ChevronsUpDown, ExternalLink, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { DeleteDrawer, RowActionButton, StatusIndicator, SafeImage } from "@/components/ui";
import { useTranslations } from 'next-intl';

interface ServersSectionProps {
  servers: ServerInfo[];
  onDelete: (serverId: string, serverName: string) => void;
  onEdit?: (serverId: string) => void;
  deleting?: string | null;
}

export function ServersSection({ servers, onDelete, onEdit }: ServersSectionProps) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const [deletingServer, setDeletingServer] = useState<ServerInfo | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingServer) return;
    await onDelete(deletingServer.id, deletingServer.name);
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
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{tCommon('status')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('cpu')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('memory')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="flex items-center gap-1 hover:text-white/40 cursor-pointer transition-colors">{t('disk')} <ChevronsUpDown size={12} className="opacity-70" /></span>
          <span className="text-right">{tCommon('action')}</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {servers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Server className="mb-3 h-8 w-8 text-white/20" strokeWidth={1.5} />
              <p className="text-sm text-white/40">{t('noServers')}</p>
            </div>
          ) : (
            servers.map((server) => {
              let currentStatus = 'active';
              let label = tCommon('active');

              if (server.suspended || server.status === 'suspended') {
                currentStatus = 'suspended';
                label = t('statusSuspended');
              } else if (server.unreachable || server.status === 'unreachable' || server.status === 'error') {
                currentStatus = 'error';
                label = t('statusUnreachable');
              } else if (server.status === 'creating') {
                currentStatus = 'pending';
                label = t('statusCreating');
              } else if (server.status === 'queued') {
                currentStatus = 'pending';
                label = server.queuePosition ? t('statusQueuedPos', { pos: server.queuePosition }) : t('statusQueued');
              }

              const statusBadge = <StatusIndicator status={currentStatus} label={label} />;

              const regionName = server.location || tCommon('unknown');
              const isDownOrUnreachable = server.unreachable || server.status?.toLowerCase() === 'unreachable' || server.status?.toLowerCase() === 'error';

              return (
                <div key={server.id} className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.015] xl:grid xl:grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px] xl:items-center text-sm">
                  <div className="min-w-0">
                    <div className="font-mono text-zinc-200 truncate font-medium">{server.name}</div>
                    <div className="font-mono text-[10px] text-zinc-500 truncate mt-0.5" title={t('dashboardId')}>{server.id}</div>
                  </div>

                  <div className="text-zinc-400 flex items-center gap-2 truncate">
                    {server.locationFlag && (
                      <SafeImage
                        src={server.locationFlag.startsWith('http')
                          ? server.locationFlag
                          : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.locationFlag.startsWith('/') ? '' : '/'}${server.locationFlag}`}
                        alt=""
                        className="w-4 h-3 object-cover rounded-sm opacity-80"
                      />
                    )}
                    {regionName}
                  </div>

                  <div className="text-zinc-400 flex items-center gap-2 truncate">
                    {server.eggIcon && (
                      <SafeImage
                        src={server.eggIcon.startsWith('http')
                          ? server.eggIcon
                          : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.eggIcon.startsWith('/') ? '' : '/'}${server.eggIcon}`}
                        alt=""
                        className="w-4 h-4 object-contain opacity-80"
                      />
                    )}
                    {server.eggName || tCommon('unknown')}
                  </div>

                  <div>{statusBadge}</div>

                  <div className="text-zinc-300">
                    <div className="flex items-center gap-1.5 font-normal text-xs">
                      <Cpu size={12} strokeWidth={1.5} className="text-white" />
                      {server.cpu}%
                    </div>
                  </div>

                  <div className="text-zinc-300">
                    <div className="flex items-center gap-1.5 font-normal text-xs">
                      <CircuitBoard size={12} strokeWidth={1.5} className="text-white" />
                      {server.memory} {t('mb')}
                    </div>
                  </div>

                  <div className="text-zinc-300">
                    <div className="flex items-center gap-1.5 font-normal text-xs">
                      <HardDrive size={12} strokeWidth={1.5} className="text-white" />
                      {server.storage} {t('mb')}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2 xl:mt-0">
                    {server.status !== 'queued' && server.status !== 'error' && (
                      <>
                        {isDownOrUnreachable || server.status === 'creating' ? (
                          <RowActionButton
                            variant="default"
                            disabled
                            title={server.status === 'creating' ? t('serverIsCreating') : t('cannotOpenUnreachable')}
                          >
                            <ExternalLink size={14} />
                          </RowActionButton>
                        ) : (
                          <RowActionButton
                            variant="default"
                            href={server.url}
                            target="_blank"
                            rel="noreferrer"
                            title={t('openServer')}
                          >
                            <ExternalLink size={14} />
                          </RowActionButton>
                        )}
                        
                        {server.suspended || server.status?.toLowerCase() === 'suspended' ? (
                          <RowActionButton
                            variant="danger"
                            disabled
                            title={t('cannotEditSuspended')}
                          >
                            <ShieldAlert size={14} />
                          </RowActionButton>
                        ) : server.status?.toLowerCase() === 'creating' ? (
                          <RowActionButton
                            variant="default"
                            disabled
                            title={t('cannotEditCreating')}
                          >
                            <Edit2 size={14} />
                          </RowActionButton>
                        ) : isDownOrUnreachable ? (
                          <RowActionButton
                            variant="default"
                            disabled
                            title={t('cannotEditUnreachable')}
                          >
                            <Edit2 size={14} />
                          </RowActionButton>
                        ) : (
                          <RowActionButton
                            variant="default"
                            onClick={() => onEdit?.(server.id)}
                            title={t('editServer')}
                          >
                            <Edit2 size={14} />
                          </RowActionButton>
                        )}
                      </>
                    )}

                    <RowActionButton
                      variant="danger"
                      onClick={() => setDeletingServer(server)}
                      disabled={server.suspended || server.status?.toLowerCase() === 'suspended' || server.status?.toLowerCase() === 'creating'}
                      title={server.status?.toLowerCase() === 'creating' ? t('cannotDeleteCreating') : (server.suspended || server.status?.toLowerCase() === 'suspended' ? t('cannotDeleteSuspended') : t('deleteServer'))}
                    >
                      <Trash2 size={14} />
                    </RowActionButton>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <DeleteDrawer
        isOpen={!!deletingServer}
        onClose={() => setDeletingServer(null)}
        onConfirm={handleConfirmDelete}
        entityType={t('deleteDrawerEntity')}
        entityName={deletingServer?.name || ''}
        entitySubText={deletingServer ? `${t('colNode')}: ${deletingServer.location || tCommon('unknown')}` : ''}
        warningPoints={
          deletingServer?.status === 'queued' || deletingServer?.status === 'error'
            ? [
                t('warnQueueRemove'),
                t('warnRecreateManual'),
                t('warnCannotUndo')
              ]
            : [
                t('warnPermDelete'),
                t('warnDataLost'),
                t('warnCannotUndo')
              ]
        }
      />
    </section>
  );
}
