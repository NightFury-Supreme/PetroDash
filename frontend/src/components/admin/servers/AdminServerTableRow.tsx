/* ==========================================================================
   Admin Server Table Row Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Cpu, CircuitBoard, HardDrive, User } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { AdminServerTableRowProps } from './types';
import { AdminServerRowActions } from './AdminServerRowActions';

export function AdminServerTableRow({
  server,
  onDelete,
  onEdit,
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

  const statusBadge = <StatusIndicator status={currentStatus} label={label} />;

  const serverUrl = server.clientUrl || '#';
  const userAvatar =
    server.userId?.profilePicture ||
    server.userId?.oauthProviders?.discord?.avatar ||
    server.userId?.oauthProviders?.google?.picture;

  const isDownOrUnreachable =
    server.unreachable || statusLower === 'unreachable' || statusLower === 'error';

  const cols = hideOwner
    ? 'lg:grid-cols-[1fr_1fr_1fr_100px_80px_100px_100px_120px]'
    : 'lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_120px]';

  return (
    <div
      className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}
    >
      {/* Server Name */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('serverName')}
        </p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">
          {server.name}
        </span>
        <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5" title={t('dashboardId')}>
          {server._id}
        </span>
      </div>

      {/* Owner */}
      {!hideOwner && (
        <div className="min-w-0">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
            {t('owner')}
          </p>
          {server.userId?._id ? (
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
          ) : (
            <span className="text-xs text-[#666]">-</span>
          )}
        </div>
      )}

      {/* Node */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('node')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
          {server.location?.flag && (
            <img
              src={
                server.location.flag.startsWith('http')
                  ? server.location.flag
                  : `${process.env.NEXT_PUBLIC_API_BASE || ''}${
                      server.location.flag.startsWith('/') ? '' : '/'
                    }${server.location.flag}`
              }
              alt="Node flag"
              className="w-5 h-4 object-cover rounded-[2px]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span className="truncate">{server.location?.name || '-'}</span>
        </div>
      </div>

      {/* Egg */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('egg')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
          {server.egg?.icon && (
            <img
              src={
                server.egg.icon.startsWith('http')
                  ? server.egg.icon
                  : `${process.env.NEXT_PUBLIC_API_BASE || ''}${
                      server.egg.icon.startsWith('/') ? '' : '/'
                    }${server.egg.icon}`
              }
              alt="Egg icon"
              className="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span className="truncate">{server.egg?.name || '-'}</span>
        </div>
      </div>

      {/* Status */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('status')}
        </p>
        <div>{statusBadge}</div>
      </div>

      {/* CPU */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('cpu')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <Cpu size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{server.limits?.cpuPercent ?? 0}%</span>
        </div>
      </div>

      {/* RAM */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('ram')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <CircuitBoard size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{(server.limits?.memoryMb ?? 0).toLocaleString()} MB</span>
        </div>
      </div>

      {/* Disk */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('disk')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <HardDrive size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{(server.limits?.diskMb ?? 0).toLocaleString()} MB</span>
        </div>
      </div>

      {/* Actions */}
      <AdminServerRowActions
        server={server}
        statusLower={statusLower}
        isDownOrUnreachable={isDownOrUnreachable}
        serverUrl={serverUrl}
        onEdit={onEdit}
        onDelete={onDelete}
        deleting={deleting}
      />
    </div>
  );
}
