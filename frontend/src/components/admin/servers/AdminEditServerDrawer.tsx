/* ==========================================================================
   Admin Edit Server Drawer
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Server,
  Save,
  Cpu,
  HardDrive,
  MemoryStick,
  Database,
  Network,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { useAdminServerEdit } from '@/hooks/admin/servers';
import { ResourceField } from './ResourceField';
import { AdminEditServerDrawerSkeleton } from './AdminEditServerDrawerSkeleton';
import { AdminEditServerDrawerFooter } from './AdminEditServerDrawerFooter';
import type { ResourceFieldDef } from './types';

interface AdminEditServerDrawerProps {
  serverId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const RESOURCE_FIELDS: ResourceFieldDef[] = [
  { key: 'cpuPercent', label: 'CPU', icon: Cpu, unit: '%' },
  { key: 'memoryMb', label: 'Memory', icon: MemoryStick, unit: 'MB' },
  { key: 'diskMb', label: 'Disk Storage', icon: HardDrive, unit: 'MB' },
  { key: 'backups', label: 'Backups', icon: Save, unit: '' },
  { key: 'databases', label: 'Databases', icon: Database, unit: '' },
  { key: 'allocations', label: 'Allocations', icon: Network, unit: '' },
];

export function AdminEditServerDrawer({
  serverId,
  onClose,
  onUpdate,
}: AdminEditServerDrawerProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const {
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
    loadServer,
    handleChange,
    handleSave: hookHandleSave,
    handleConfirmDelete: hookHandleConfirmDelete,
  } = useAdminServerEdit(serverId, onUpdate, onClose);

  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);

  useEffect(() => {
    loadServer().catch((err: unknown) => {
      const errKey = err instanceof Error ? err.message : 'ERR_STATS_FETCH_FAILED';
      setErrorMsg(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : tCommon('error')));
    });
  }, [loadServer, tErrorBackend, tCommon, setErrorMsg]);

  const handleConfirmDelete = async () => {
    try {
      await hookHandleConfirmDelete();
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_DELETION_FAILED';
      setErrorMsg(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : tCommon('error')));
    }
  };

  const handleSave = async () => {
    try {
      await hookHandleSave();
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_UPDATE_FAILED';
      setErrorMsg(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : tCommon('error')));
    }
  };

  const isSuspended = server?.suspended || server?.status?.toLowerCase() === 'suspended';
  const isUnreachable = server?.unreachable || server?.status?.toLowerCase() === 'unreachable';
  const canEdit = !isSuspended && !isUnreachable;

  const headerExtra = server ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#161616] px-2.5 py-1 text-xs text-[#888]">
        {server.location?.flag && (
          <img
            src={server.location.flag.startsWith('http')
              ? server.location.flag
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.location.flag.startsWith('/') ? '' : '/'}${server.location.flag}`}
            alt="Node flag"
            className="w-3.5 h-3 object-cover rounded-[2px]"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {server.location?.name}
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#161616] px-2.5 py-1 text-xs text-[#888]">
        {server.egg?.icon && (
          <img
            src={server.egg.icon.startsWith('http')
              ? server.egg.icon
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.egg.icon.startsWith('/') ? '' : '/'}${server.egg.icon}`}
            alt="Egg icon"
            className="w-3.5 h-3.5 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {server.egg?.name}
      </span>
    </div>
  ) : null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={loading ? t('editServerTitle') : (server?.name ?? t('editServerTitle'))}
      subtitle={server?.uuid ? t('uuidSubtitle', { uuid: server.uuid.split('-')[0] }) : t('updateConfigSubtitle')}
      icon={<Server className="text-[#D4D4D4]" size={22} />}
      headerExtra={headerExtra}
      footer={
        !loading && server ? (
          <AdminEditServerDrawerFooter
            server={server}
            canEdit={canEdit}
            isDeleting={isDeleting}
            isSuspended={Boolean(isSuspended)}
            isUnreachable={Boolean(isUnreachable)}
            saving={saving}
            saved={saved}
            failed={failed}
            name={name}
            onClose={onClose}
            onOpenDelete={() => setShowDeleteDrawer(true)}
            onSave={handleSave}
          />
        ) : null
      }
    >
      {loading ? (
        <AdminEditServerDrawerSkeleton />
      ) : errorMsg && !server ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-sm font-medium text-[#D4D4D4]">{errorMsg}</p>
          <button type="button" onClick={loadServer} className="text-xs text-[#FF5722] hover:underline mt-2">
            {t('tryAgain')}
          </button>
        </div>
      ) : isSuspended ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert size={24} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#D4D4D4]">{t('serverSuspended')}</p>
              <p className="text-xs text-[#888] mt-1 max-w-[280px]">
                {t('serverSuspendedDesc')}
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
              <p className="text-sm font-medium text-[#D4D4D4]">{t('serverUnreachable')}</p>
              <p className="text-xs text-[#888] mt-1 max-w-[280px]">
                {t('serverUnreachableDesc')}
              </p>
            </div>
          </div>
        </div>
      ) : server ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-base font-semibold text-white">{t('serverDetails')}</h2>
            <p className="mt-0.5 text-sm text-[#888]">{t('serverDetailsDesc')}</p>

            <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
              {t('serverNameLabel')} <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('enterServerName')}
              className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
            />
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-base font-semibold text-white">{t('resourceLimits')}</h2>
            </div>
            <p className="text-sm text-[#888]">{t('resourceLimitsDesc')}</p>

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

      <DeleteDrawer
        isOpen={showDeleteDrawer}
        onClose={() => setShowDeleteDrawer(false)}
        onConfirm={handleConfirmDelete}
        entityType={tCommon('server')}
        entityName={server?.name || ''}
        warningPoints={[
          t('deleteWarning1'),
          t('deleteWarning2'),
          t('cannotUndo'),
        ]}
      />
    </Drawer>
  );
}
