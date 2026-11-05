'use client';

import React from 'react';
import { Cpu, CircuitBoard, HardDrive } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { AdminServerTableRowProps } from './types';
import { AdminServerRowActions } from './AdminServerRowActions';
import { StatusIndicator, UserAvatar, SafeImage } from '@/components/ui';

export function AdminServerTableRow({
  server,
  onDelete,
  onEdit,
  onSuspend,
  onUnsuspend,
  deleting,
  hideOwner = false,
}: AdminServerTableRowProps) {
  const t = useTranslations('admin.servers');

  const statusLower = server.status?.toLowerCase();
  
  let currentStatus = 'active';
  let label = t('active');

  if (server.suspended || statusLower === 'suspended') {
    currentStatus = 'suspended';
    label = t('suspended');
  } else if (server.unreachable || statusLower === 'unreachable') {
    currentStatus = 'error';
    label = t('unreachable');
  } else if (statusLower === 'error') {
    currentStatus = 'error';
    label = t('failed');
  } else if (statusLower === 'creating') {
    currentStatus = 'pending';
    label = t('creating');
  } else if (statusLower === 'queued') {
    currentStatus = 'pending';
    label = t('queued');
  }

  const suspensionExpiry = server.suspendedUntil ? new Date(server.suspendedUntil).toUTCString() : t('permanentSuspension');
  const suspensionTooltip = (server.suspended || statusLower === 'suspended') ? `${server.suspensionReason || t('noReasonProvided')} (${suspensionExpiry})` : undefined;
  const statusBadge = <StatusIndicator status={currentStatus} label={label} />;

  const serverUrl = server.clientUrl || '#';
  const userAvatar =
    server.userId?.profilePicture ||
    server.userId?.oauthProviders?.discord?.avatar ||
    server.userId?.oauthProviders?.google?.picture;

  const isDownOrUnreachable =
    server.unreachable || statusLower === 'unreachable' || statusLower === 'error';

  const cols = hideOwner
    ? 'lg:grid-cols-[1fr_1fr_1fr_100px_80px_100px_100px_160px]'
    : 'lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_160px]';

  return (
    <div
      className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}
    >
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('serverName')}
        </p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">
          {server.name}
        </span>
        <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5" title={t('dashboardId')}>
          {server.id}
        </span>
      </div>

      {!hideOwner && (
        <div className="min-w-0">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
            {t('owner')}
          </p>
          {server.userId?.id ? (
            <Link
              href={`/admin/users/${server.userId.id}`}
              className="flex items-center gap-2 group/link w-fit"
            >
              <UserAvatar
                src={userAvatar}
                username={server.userId.username}
                email={server.userId.email}
                size="sm"
                rounded="full"
              />
              <div className="min-w-0">
                <p className="text-xs text-[#D4D4D4] group-hover/link:text-[#FF5722] transition-colors truncate">
                  {server.userId.username}
                </p>
                <p className="text-[10px] text-[#555] truncate">
                  {server.userId.email}
                </p>
              </div>
            </Link>
          ) : (
            <span className="text-xs text-[#666]">-</span>
          )}
        </div>
      )}

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('node')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
          {server.location?.flag && (
            <SafeImage
              src={
                server.location.flag.startsWith('http')
                  ? server.location.flag
                  : `${process.env.NEXT_PUBLIC_API_BASE || ''}${
                      server.location.flag.startsWith('/') ? '' : '/'
                    }${server.location.flag}`
              }
              alt=""
              className="w-5 h-4 object-cover rounded-[2px]"
            />
          )}
          <span className="truncate">{server.location?.name || '-'}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('egg')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
          {server.egg?.icon && (
            <SafeImage
              src={
                server.egg.icon.startsWith('http')
                  ? server.egg.icon
                  : `${process.env.NEXT_PUBLIC_API_BASE || ''}${
                      server.egg.icon.startsWith('/') ? '' : '/'
                    }${server.egg.icon}`
              }
              alt=""
              className="w-5 h-5 object-contain"
            />
          )}
          <span className="truncate">{server.egg?.name || '-'}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('status')}
        </p>
        <div title={suspensionTooltip}>{statusBadge}</div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('cpu')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <Cpu size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{server.limits?.cpuPercent ?? 0}%</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('ram')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <CircuitBoard size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{(server.limits?.memoryMb ?? 0).toLocaleString()} MB</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('disk')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <HardDrive size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{(server.limits?.diskMb ?? 0).toLocaleString()} MB</span>
        </div>
      </div>

      <AdminServerRowActions
        server={server}
        statusLower={statusLower}
        isDownOrUnreachable={isDownOrUnreachable}
        serverUrl={serverUrl}
        onEdit={onEdit}
        onDelete={onDelete}
        onSuspend={onSuspend}
        onUnsuspend={onUnsuspend}
        deleting={deleting}
      />
    </div>
  );
}
