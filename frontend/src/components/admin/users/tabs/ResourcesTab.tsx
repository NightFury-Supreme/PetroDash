import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { Cpu, HardDrive, Database, Server, Network, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

interface ResourcesTabProps {
  resources: any;
  setResources: React.Dispatch<React.SetStateAction<any>>;
  onUpdateResources: (newResources: Record<string, number>) => Promise<any>;
  userId?: string;
  onRefresh?: () => void;
}

export function ResourcesTab({
  resources,
  setResources: _setResources,
  onUpdateResources,
  userId: _userId,
  onRefresh: _onRefresh,
}: ResourcesTabProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const { showError } = useToast();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');

  const beginEdit = (field: string) => {
    setEditing(field);
    setDraft(resources[field] || 0);
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!editing) return false;
    try {
      const newResources = { ...resources, [editing]: Number(draft) };
      await onUpdateResources(newResources);
      setEditing(null);
      return true;
    } catch (e: any) {
      showError(e.message || tCommon('error'));
      return false;
    }
  };

  const customInputCls =
    "h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight text-white">{t('serverResourcesGlobal')}</h3>
          <p className="mt-2 text-sm text-white/35">{t('serverResourcesGlobalDesc')}</p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <InfoRow
            icon={<Cpu size={14} />}
            label={t('cpuPercent')}
            description={t('cpuPercentDesc')}
            value={resources.cpuPercent || 0}
            editing={editing === "cpuPercent"}
            draft={draft}
            field="cpuPercent"
            onEdit={() => beginEdit("cpuPercent")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<HardDrive size={14} />}
            label={t('memoryMb')}
            description={t('memoryMbDesc')}
            value={resources.memoryMb || 0}
            editing={editing === "memoryMb"}
            draft={draft}
            field="memoryMb"
            onEdit={() => beginEdit("memoryMb")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<Database size={14} />}
            label={t('diskMb')}
            description={t('diskMbDesc')}
            value={resources.diskMb || 0}
            editing={editing === "diskMb"}
            draft={draft}
            field="diskMb"
            onEdit={() => beginEdit("diskMb")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<Server size={14} />}
            label={t('serverSlots')}
            description={t('serverSlotsDesc')}
            value={resources.serverSlots || 0}
            editing={editing === "serverSlots"}
            draft={draft}
            field="serverSlots"
            onEdit={() => beginEdit("serverSlots")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<Network size={14} />}
            label={t('allocations')}
            description={t('allocationsDesc')}
            value={resources.allocations || 0}
            editing={editing === "allocations"}
            draft={draft}
            field="allocations"
            onEdit={() => beginEdit("allocations")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<Layers size={14} />}
            label={t('backups')}
            description={t('backupsDesc')}
            value={resources.backups || 0}
            editing={editing === "backups"}
            draft={draft}
            field="backups"
            onEdit={() => beginEdit("backups")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className={customInputCls}
              />
            }
          />
          <InfoRow
            icon={<Database size={14} />}
            label={t('databases')}
            description={t('databasesDesc')}
            value={resources.databases || 0}
            editing={editing === "databases"}
            draft={draft}
            field="databases"
            onEdit={() => beginEdit("databases")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            customEdit={
              <input
                type="number"
                autoFocus
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className={customInputCls}
              />
            }
          />
        </div>
      </section>
    </div>
  );
}
