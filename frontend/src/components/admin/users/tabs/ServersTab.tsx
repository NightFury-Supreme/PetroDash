import { useModal } from '@/components/Modal';
import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import AdminServersTable from "@/components/admin/servers/AdminServersTable";
import { AdminEditServerDrawer } from "@/components/admin/servers/AdminEditServerDrawer";
import { useTranslations } from "next-intl";
import { adminUsersApi } from "@/utils/api/adminUsers";

export function ServersTab({ user, servers, onRefresh }: any) {
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showError } = useToast();
  const modal = useModal();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const formattedServers = servers.map((s: any) => ({
    ...s,
    userId: user,
    location: s.locationId || {},
    egg: s.eggId || {}
  }));

  const handleDelete = async (id: string, name: string) => {
    const inputValue = await modal.prompt({
      title: t('deleteServerTitle'),
      content: (
        <div>
          {t('deleteServerPrompt1')} <span className="bg-[#222] border border-[#2A2A2A] px-[6px] py-[2px] rounded-[4px] font-mono text-[#D4D4D4] text-[12px]">{name}</span>. 
          <br /><br />
          {t('deleteServerPrompt2')}
          <br /><br />
          {t('deleteServerPrompt3')} <strong className="text-white font-medium">{t('deleteKeyword')}</strong> {t('deleteServerPrompt4')}
        </div>
      ),
      confirmText: t('deleteBtn'),
      danger: true,
      requiredInput: t('deleteKeyword')
    });

    if (!inputValue || inputValue.toLowerCase() !== t('deleteKeyword').toLowerCase()) {
      if (inputValue !== null) {
        showError(t('deleteKeywordError'));
      }
      return;
    }
    
    setDeleting(id);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const { res, data } = await adminUsersApi.deleteServer(id, token);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete server');
      }
      onRefresh();
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
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
            <div className="p-8 text-center text-sm text-white/40">
              {t('noServers')}
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
    </div>
  );
}
