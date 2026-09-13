"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useEffect, useState } from 'react';
import EggForm from '@/components/admin/eggs/EggForm';
import { Drawer } from '@/components/ui/Drawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { Egg, Trash } from 'lucide-react';

type EnvVar = { key: string; value: string };

interface EditEggDrawerProps {
  eggId: string;
  onClose: () => void;
  onUpdate: () => void;
}

function DrawerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full animate-in fade-in duration-300 px-1 pb-6 space-y-8">
      <section className="space-y-5">
        <div>
          <div className="h-4 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
          <div className="h-3 w-48 rounded bg-white/[0.02] animate-pulse" />
        </div>
        
        <div>
          <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
          <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
        </div>

        <div>
          <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
          <div className="h-[84px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      <section className="space-y-5">
        <div>
          <div className="h-4 w-48 rounded bg-white/[0.03] animate-pulse mb-1.5" />
          <div className="h-3 w-64 rounded bg-white/[0.02] animate-pulse" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-3 w-20 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
          <div>
            <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse mb-1.5" />
            <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function EditEggDrawer({ eggId, onClose, onUpdate }: EditEggDrawerProps) {
  const [form, setForm] = useState<{ _id: string; name: string; description: string; pterodactylEggId: string; pterodactylNestId: string; recommended: boolean; allowedPlans: string[]; category?: string; icon?: string; serversCount?: number } | null>(null);
  const [env, setEnv] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [, setError] = useState<string | null>(null);
  
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${eggId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (r) => {
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setForm({
        _id: d._id || String(eggId),
        name: d.name || '',
        category: d.category || '',
        icon: d.icon || '',
        pterodactylEggId: d.pterodactylEggId?.toString() || '',
        pterodactylNestId: d.pterodactylNestId?.toString() || '',
        recommended: !!d.recommended,
        description: d.description || '',
        allowedPlans: Array.isArray(d.allowedPlans) ? d.allowedPlans : [],
        serversCount: d.serversCount,
      });
      setEnv(d.env || []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [eggId]);

  const update = async (e: React.FormEvent, updatedForm?: any) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const finalForm = updatedForm || form;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${eggId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...finalForm,
          pterodactylEggId: parseInt(finalForm.pterodactylEggId || '0', 10),
          pterodactylNestId: parseInt(finalForm.pterodactylNestId || '0', 10),
          env
        }),
      });
      if (!res.ok) {
        let d: any = {}; try { d = await res.json(); } catch {}
        throw new Error(d?.error || 'Failed to update');
      }
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update egg');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${eggId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      let d: any = {}; try { d = await res.json(); } catch {}
      throw new Error(d?.error || 'Failed to delete');
    }
    onUpdate();
    onClose();
  };

  return (
    <>
      <Drawer
        isOpen={true}
        onClose={onClose}
        title={loading ? "Edit Egg" : (form?.name ?? "Edit Egg")}
        subtitle={form?._id ? `ID: ${form._id}` : 'Update configuration'}
        icon={<Egg className="text-[#D4D4D4]" size={22} />}
        footer={
          !loading && form ? (
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 group relative">
                  <button
                    type="button"
                    onClick={() => (!form.serversCount || form.serversCount === 0) && setIsDeleteDrawerOpen(true)}
                    disabled={form.serversCount !== undefined && form.serversCount > 0}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={form.serversCount !== undefined && form.serversCount > 0 ? "Cannot delete egg with existing servers" : ""}
                  >
                    <Trash size={15} />
                    Delete
                  </button>
                </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-lg border border-[#222] bg-transparent px-4 py-2.5 text-sm font-medium text-[#D4D4D4] transition-colors hover:bg-[#161616] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="egg-form"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[#888]">Loading...</span>
            </div>
          )
        }
      >
        <div className="flex flex-col h-full overflow-hidden">
          {loading || !form ? (
            <DrawerSkeleton />
          ) : (
            <div className="flex-1 overflow-y-auto px-1 pb-6">
              <EggForm
                form={form}
                setForm={setForm}
                env={env}
                setEnv={setEnv}
                onSubmit={update}
                onDelete={() => setIsDeleteDrawerOpen(true)}
                submitting={submitting}
                submitLabel="Save Changes"
                hideFooter={true}
              />
            </div>
          )}
        </div>
      </Drawer>

      <DeleteDrawer
        isOpen={isDeleteDrawerOpen}
        onClose={() => setIsDeleteDrawerOpen(false)}
        onConfirm={remove}
        entityType="Egg"
        entityName={form?.name || ''}
        entitySubText={form ? `Nest ID: ${form.pterodactylNestId} | Egg ID: ${form.pterodactylEggId}` : ''}
        icon={
          form?.icon ? (
            <img src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${form.icon}`} className="w-6 h-6 object-contain rounded" />
          ) : <Egg size={24} />
        }
        warningPoints={[
          "Egg configuration will be permanently deleted.",
          "Any new servers will not be able to use this egg.",
          "This action cannot be undone."
        ]}
      />
    </>
  );
}
