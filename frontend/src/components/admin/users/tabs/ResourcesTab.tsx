import { fetchWithRetry } from "@/utils/fetchWithRetry";
import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { Cpu, HardDrive, Database, Server, Network, Layers } from "lucide-react";

export function ResourcesTab({ resources, setResources, userId, onRefresh: _onRefresh }: any) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);
    const { showError } = useToast();

  const beginEdit = (field: string) => {
    setEditing(field);
    setDraft(resources[field] || 0);
  };

  const cancelEdit = () => { setEditing(null); setDraft(null); };

  const saveEdit = async () => {
    if (!editing) return false;
    try {
      const token = localStorage.getItem('auth_token');
      const newResources = { ...resources, [editing]: Number(draft) };
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resources: newResources })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save');
      setResources(newResources);
      setEditing(null);
      return true;
    } catch (e: any) {
      showError(e.message || 'Failed to save');
      return false;
    }
  };

  const customInputCls = "h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight text-white">Server Resources (Global)</h3>
          <p className="mt-2 text-sm text-white/35">Edit global resource limits for this user.</p>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <InfoRow icon={<Cpu size={14} />} label="CPU (%)" description="Total CPU allowance across all servers." value={resources.cpuPercent || 0} editing={editing === "cpuPercent"} field="cpuPercent" onEdit={() => beginEdit("cpuPercent")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<HardDrive size={14} />} label="RAM (MB)" description="Total RAM allowance." value={resources.memoryMb || 0} editing={editing === "memoryMb"} field="memoryMb" onEdit={() => beginEdit("memoryMb")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Database size={14} />} label="Disk (MB)" description="Total Disk storage allowance." value={resources.diskMb || 0} editing={editing === "diskMb"} field="diskMb" onEdit={() => beginEdit("diskMb")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Server size={14} />} label="Slots" description="Maximum number of servers." value={resources.serverSlots || 0} editing={editing === "serverSlots"} field="serverSlots" onEdit={() => beginEdit("serverSlots")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Network size={14} />} label="Allocations" description="Maximum number of allocations." value={resources.allocations || 0} editing={editing === "allocations"} field="allocations" onEdit={() => beginEdit("allocations")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Layers size={14} />} label="Backups" description="Maximum number of backups." value={resources.backups || 0} editing={editing === "backups"} field="backups" onEdit={() => beginEdit("backups")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
          <InfoRow icon={<Database size={14} />} label="Databases" description="Maximum number of databases." value={resources.databases || 0} editing={editing === "databases"} field="databases" onEdit={() => beginEdit("databases")} onCancel={cancelEdit} onSave={saveEdit} customEdit={<input type="number" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} className={customInputCls} />} />
        </div>
      </section>
    </div>
  );
}
