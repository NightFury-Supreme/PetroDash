import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { Cpu, HardDrive, Database, Server, Network, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { adminUsersApi } from "@/utils/api/adminUsers";

export function ResourcesTab({ resources, setResources, userId, onRefresh: _onRefresh }: any) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const { showError } = useToast();
  const t = useTranslations('Admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const beginEdit = (field: string) => {
    setEditing(field);
    setDraft(resources[field] || 0);
  };

  const cancelEdit = () => { setEditing(null); setDraft(null); };

  const saveEdit = async () => {
    if (!editing) return false;
    try {
      const token = localStorage.getItem('auth_token') || '';
      const newResources = { ...resources, [editing]: Number(draft) };
      
      const { res, data } = await adminUsersApi.updateUser(userId, { resources: newResources }, token);
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      setResources(newResources);
      setEditing(null);
      return true;
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
      return false;
    }
  };

  const customInputCls = "h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight text-white">{t('serverResourcesGlobal')}</h3>
          <p className="mt-2 text-sm text-white/35">{t('serverResourcesGlobalDesc')}</p>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <InfoRow icon={<Cpu size={14} />} label={t('cpuPercent')} description={t('cpuPercentDesc')} value={resources.cpuPercent || 0} editing={editing === "cpuPercent"} field="cpuPercent" onEdit={() => beginEdit("cpuPercent")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<HardDrive size={14} />} label={t('memoryMb')} description={t('memoryMbDesc')} value={resources.memoryMb || 0} editing={editing === "memoryMb"} field="memoryMb" onEdit={() => beginEdit("memoryMb")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Database size={14} />} label={t('diskMb')} description={t('diskMbDesc')} value={resources.diskMb || 0} editing={editing === "diskMb"} field="diskMb" onEdit={() => beginEdit("diskMb")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Server size={14} />} label={t('serverSlots')} description={t('serverSlotsDesc')} value={resources.serverSlots || 0} editing={editing === "serverSlots"} field="serverSlots" onEdit={() => beginEdit("serverSlots")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Network size={14} />} label={t('allocations')} description={t('allocationsDesc')} value={resources.allocations || 0} editing={editing === "allocations"} field="allocations" onEdit={() => beginEdit("allocations")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Layers size={14} />} label={t('backups')} description={t('backupsDesc')} value={resources.backups || 0} editing={editing === "backups"} field="backups" onEdit={() => beginEdit("backups")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Database size={14} />} label={t('databases')} description={t('databasesDesc')} value={resources.databases || 0} editing={editing === "databases"} field="databases" onEdit={() => beginEdit("databases")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
        </div>
      </section>
    </div>
  );
}
