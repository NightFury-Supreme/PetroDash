import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import AdminServersTable from "@/components/admin/servers/AdminServersTable";
import { AdminEditServerDrawer } from "@/components/admin/servers/AdminEditServerDrawer";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useTranslations } from "next-intl";

interface ServersTabProps {
  user: any;
  servers: any[];
  onDeleteServer: (serverId: string) => Promise<any>;
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

  const formattedServers = (servers || []).map((s: any) => ({
    ...s,
    userId: user,
    location: s.locationId || {},
    egg: s.eggId || {},
  }));

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
    } catch (e: any) {
      showError(e.message || tCommon('error'));
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
            <div className="p-8 text-center text-sm text-white/40">{t('noServers')}</div>
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
