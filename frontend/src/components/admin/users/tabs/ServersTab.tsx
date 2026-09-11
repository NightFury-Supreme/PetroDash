import { useModal } from '@/components/Modal';
import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import AdminServersTable from "@/components/admin/servers/AdminServersTable";
import { AdminEditServerDrawer } from "@/components/admin/servers/AdminEditServerDrawer";

export function ServersTab({ user, servers, onRefresh }: any) {
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();
  const modal = useModal();

  const formattedServers = servers.map((s: any) => ({
    ...s,
    userId: user,
    location: s.locationId || {},
    egg: s.eggId || {}
  }));

  const handleDelete = async (id: string, name: string) => {
    const inputValue = await modal.prompt({
      title: 'Delete Server',
      content: (
        <div>
          You are about to permanently delete the server <span className="bg-[#222] border border-[#2A2A2A] px-[6px] py-[2px] rounded-[4px] font-mono text-[#D4D4D4] text-[12px]">{name}</span>. 
          <br /><br />
          This will remove the server from both the database and the Pterodactyl panel. This action cannot be undone.
          <br /><br />
          Please type <strong className="text-white font-medium">delete</strong> to confirm.
        </div>
      ),
      confirmText: 'Delete',
      danger: true,
      requiredInput: 'delete'
    });

    if (!inputValue || inputValue.toLowerCase() !== 'delete') {
      if (inputValue !== null) {
        showError('You must type "delete" to confirm.');
      }
      return;
    }
    
    setDeleting(id);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete server');
      }
      onRefresh();
    } catch (e: any) {
      showError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight text-white">User Servers</h3>
          <p className="mt-2 text-sm text-white/35">Manage servers owned by this user.</p>
        </div>
        
        <div className="mt-6">
          {formattedServers.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/40">
              This user has no servers.
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
