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
} from 'lucide-react';
import { Drawer, DeleteDrawer } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { useAdminServerEdit } from '@/hooks/admin/servers';
import { ResourceField } from './ResourceField';
import { AdminEditServerDrawerSkeleton } from './AdminEditServerDrawerSkeleton';
import { AdminEditServerDrawerFooter } from './AdminEditServerDrawerFooter';
import { AdminEditServerHeaderBadges } from './AdminEditServerHeaderBadges';
import { AdminServerSuspendedNotice } from './AdminServerSuspendedNotice';
import { AdminServerUnreachableNotice } from './AdminServerUnreachableNotice';
import type { AdminServer, ResourceFieldDef } from './types';

interface AdminEditServerDrawerProps {
  serverId: string;
  onClose: () => void;
  onUpdate?: () => void;
  onSuspend?: (server: AdminServer) => void;
  onUnsuspend?: (server: AdminServer) => void;
  refreshKey?: number;
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
  onSuspend,
  onUnsuspend,
  refreshKey,
}: AdminEditServerDrawerProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showSuccess, showError } = useToast();

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
      const message = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : tCommon('error'));
      setErrorMsg(message);
      showError(message);
    });
  }, [loadServer, tErrorBackend, tCommon, setErrorMsg, showError]);

  useEffect(() => {
    if (refreshKey) {
      loadServer(true).catch(() => {});
    }
  }, [refreshKey, loadServer]);

  const handleConfirmDelete = async () => {
    try {
      const serverName = server?.name || '';
      await hookHandleConfirmDelete();
      setShowDeleteDrawer(false);
      showSuccess(t('success.serverDeleted', { name: serverName }));
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_DELETION_FAILED';
      const message = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : t('errors.failedToDelete'));
      setErrorMsg(message);
      showError(message);
    }
  };

  const handleSave = async () => {
    try {
      await hookHandleSave();
      showSuccess(t('success.serverUpdated'));
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_UPDATE_FAILED';
      const message = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : t('failedToSave'));
      setErrorMsg(message);
      showError(message);
    }
  };

  const isSuspended = server?.suspended || server?.status?.toLowerCase() === 'suspended';
  const isUnreachable = server?.unreachable || server?.status?.toLowerCase() === 'unreachable';
  const canEdit = !isSuspended && !isUnreachable;

  const headerExtra = server ? (
    <AdminEditServerHeaderBadges
      server={server}
      isSuspended={Boolean(isSuspended)}
    />
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
            saving={saving}
            saved={saved}
            failed={failed}
            name={name}
            onClose={onClose}
            onOpenDelete={() => setShowDeleteDrawer(true)}
            onSave={handleSave}
            onSuspend={onSuspend ? () => onSuspend(server) : undefined}
            onUnsuspend={onUnsuspend ? () => onUnsuspend(server) : undefined}
          />
        ) : null
      }
    >
      {loading ? (
        <AdminEditServerDrawerSkeleton />
      ) : errorMsg && !server ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-sm font-medium text-[#D4D4D4]">{errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              loadServer(true).catch((err: unknown) => {
                const errKey = err instanceof Error ? err.message : 'ERR_STATS_FETCH_FAILED';
                const message = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : tCommon('error'));
                setErrorMsg(message);
                showError(message);
              });
            }}
            className="text-xs text-[#FF5722] hover:underline mt-2"
          >
            {t('tryAgain')}
          </button>
        </div>
      ) : isSuspended && server ? (
        <AdminServerSuspendedNotice
          server={server}
          onUnsuspend={onUnsuspend}
        />
      ) : isUnreachable ? (
        <AdminServerUnreachableNotice />
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
