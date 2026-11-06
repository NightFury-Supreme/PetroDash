import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import AdminServersTable from "@/components/admin/servers/AdminServersTable";
import { AdminEditServerDrawer } from "@/components/admin/servers/AdminEditServerDrawer";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { Server } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminServer, ServerLimits } from "@/components/admin/servers/types";
import type { UserFormData } from "@/hooks/admin/users/types";

interface UserServerItem {
  id?: string;
  name?: string;
  status?: string;
  limits?: ServerLimits;
  createdAt?: string;
  locationId?: { id: string; name: string; flag?: string };
  eggId?: { id: string; name: string; icon?: string };
  [key: string]: unknown;
}

interface ServersTabProps {
  user: UserFormData | null;
  servers: UserServerItem[];
  onDeleteServer: (serverId: string) => Promise<unknown>;
  onRefresh: () => void;
}

export function ServersTab({ user, servers, onDeleteServer, onRefresh }: ServersTabProps) {
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [deletingServer, setDeletingServer] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();
  const t = useTranslations('admin.users');
  const tServers = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const formattedServers: AdminServer[] = (servers || []).map((s) => ({
    id: s.id || '',
    name: s.name || '',
    status: s.status || 'unknown',
    limits: s.limits || { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 },
    createdAt: s.createdAt || '',
    ...s,
    userId: {
      id: user?.id || '',
      username: user?.username || 'User',
      email: user?.email || '',
    },
    location: s.locationId || { id: '', name: '' },
    egg: s.eggId || { id: '', name: '' },
  } as AdminServer));

  const handleDelete = (id: string, name: string) => {
    setDeletingServer({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deletingServer) return;
    setDeleting(deletingServer.id);
    try {
      await onDeleteServer(deletingServer.id);
      showSuccess(tServers('success.serverDeleted', { name: deletingServer.name }));
      onRefresh();
      setDeletingServer(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight text-white">{t('userServers')}</h3>
          <p className="mt-2 text-sm text-white/35">{t('userServersDesc')}</p>
        </div>

        <div className="mt-6">
          {formattedServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Server className="mb-3 h-8 w-8 text-white/20" strokeWidth={1.5} />
              <p className="text-sm text-white/40">{t('noServers')}</p>
            </div>
          ) : (
            <AdminServersTable
              servers={formattedServers}
              onEdit={setEditingServer}
              onDelete={handleDelete}
              deleting={deleting}
              hideOwner
            />
          )}
        </div>
      </section>

      {editingServer && (
        <AdminEditServerDrawer
          serverId={editingServer}
          onClose={() => setEditingServer(null)}
          onUpdate={() => {
            setEditingServer(null);
            onRefresh();
          }}
        />
      )}

      <DeleteDrawer
        isOpen={Boolean(deletingServer)}
        onClose={() => setDeletingServer(null)}
        onConfirm={handleConfirmDelete}
        entityType={tServers('drawer.serverEntity')}
        entityName={deletingServer?.name || ''}
        warningPoints={[
          tServers('drawer.deleteWarning1'),
          tServers('drawer.deleteWarning2'),
          tServers('drawer.deleteWarning3'),
        ]}
      />
    </div>
  );
}
