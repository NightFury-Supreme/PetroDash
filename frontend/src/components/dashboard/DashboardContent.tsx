"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDashboard } from '../../hooks/useDashboard';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '@/components/ui/ToastProvider';
import { MetricCard } from './MetricCard';
import { DashboardStatus } from './DashboardStatus';
import { ResourceUsagePanel } from './ResourceUsagePanel';
import { ServersSection } from './ServersSection';
import { CreateServerDrawer } from '../server/CreateServerDrawer';
import { EditServerDrawer } from '../server/EditServerDrawer';
import { Plus, RefreshCw, Server, Cpu, HardDrive, Database } from 'lucide-react';

export function DashboardContent() {
  const { showError, showSuccess } = useToast();
  const t = useTranslations('Dashboard');
  const { servers, usage, resources, removeServer, loadDashboardData } = useDashboard();
  const { form } = useProfile();
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const username = form?.username || 'User';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  }, [loadDashboardData]);

  const handleDelete = useCallback(async (serverId: string, serverName: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      showError(t('authRequired'));
      return;
    }

    try {
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/${serverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        let errorData: any = {}; try { errorData = await response.json(); } catch {}
        throw new Error(errorData?.error || 'Failed to delete server');
      }

      removeServer(serverId);
      showSuccess(t('deleteServerSuccess', { name: serverName }));
    } catch (e: any) {
      throw e; // DeleteDrawer will catch this and call showError
    }
  }, [removeServer, showError, showSuccess, t]);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('welcomeBack')} <span className="text-[#FF5722]">{username}</span></h1>
          <p className="text-[#888888] mt-1 text-sm">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
          >
            <Plus size={12} />
            {t('createServer')}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title={t('refresh')}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        <MetricCard
          title={t('servers')}
          value={usage?.servers || 0}
          subtitle={t('servers')}
          bottomLabel={t('limit')}
          bottomValue={resources?.serverSlots?.toString() || '0'}
          icon={<Server size={14} />}
        />
        <MetricCard
          title={t('cpu')}
          value={`${usage?.cpuPercent || 0}`}
          subtitle={t('percent')}
          bottomLabel={t('limit')}
          bottomValue={`${resources?.cpuPercent || 0}${t('percent')}`}
          icon={<Cpu size={14} />}
        />
        <MetricCard
          title={t('memory')}
          value={usage?.memoryMb || 0}
          subtitle={t('mb')}
          bottomLabel={t('limit')}
          bottomValue={`${resources?.memoryMb?.toLocaleString() || 0} ${t('mb')}`}
          icon={<Database size={14} />}
        />
        <MetricCard
          title={t('disk')}
          value={usage?.diskMb || 0}
          subtitle={t('mb')}
          bottomLabel={t('limit')}
          bottomValue={`${resources?.diskMb?.toLocaleString() || 0} ${t('mb')}`}
          icon={<HardDrive size={14} />}
        />
      </section>

      {/* Status + Resource Usage Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        <div className="lg:col-span-2 lg:border-r lg:border-white/[0.06]">
          <DashboardStatus />
        </div>
        <div className="lg:col-span-1">
          <ResourceUsagePanel usage={usage} resources={resources} />
        </div>
      </section>

      {/* Servers Section - handles delete drawer internally */}
      <ServersSection
        servers={servers}
        onDelete={handleDelete}
        onEdit={(id) => setEditingServerId(id)}
      />

      {/* Create Server Drawer */}
      {showCreateDrawer && (
        <CreateServerDrawer
          onClose={() => setShowCreateDrawer(false)}
          onUpdate={() => {
            setShowCreateDrawer(false);
            loadDashboardData();
          }}
        />
      )}

      {/* Edit Server Drawer */}
      {editingServerId && (
        <EditServerDrawer
          serverId={editingServerId}
          onClose={() => setEditingServerId(null)}
          onUpdate={() => {
            setEditingServerId(null);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
