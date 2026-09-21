"use client";

import { useTranslations } from "next-intl";

export default function ServerLimitsForm({ limits, onChange }: { limits: any; onChange: (field: string, value: number) => void }) {
  const t = useTranslations('Admin.servers');

  return (
    <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <h2 className="text-xl font-bold mb-6">{t('resourceLimits')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">{t('cpuLimit')}</label>
          <input
            type="number"
            value={limits.cpuPercent}
            onChange={(e) => onChange('cpuPercent', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('cpuLimitDesc')}</p>
        </div>
        <div>
          <label className="label">{t('memoryLimit')}</label>
          <input
            type="number"
            value={limits.memoryMb}
            onChange={(e) => onChange('memoryMb', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('memoryLimitDesc')}</p>
        </div>
        <div>
          <label className="label">{t('diskLimit')}</label>
          <input
            type="number"
            value={limits.diskMb}
            onChange={(e) => onChange('diskMb', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('diskLimitDesc')}</p>
        </div>
        <div>
          <label className="label">{t('allocationLimit')}</label>
          <input
            type="number"
            value={limits.allocations}
            onChange={(e) => onChange('allocations', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('allocationLimitDesc')}</p>
        </div>
        <div>
          <label className="label">{t('backupLimit')}</label>
          <input
            type="number"
            value={limits.backups}
            onChange={(e) => onChange('backups', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('backupLimitDesc')}</p>
        </div>
        <div>
          <label className="label">{t('databaseLimit')}</label>
          <input
            type="number"
            value={limits.databases}
            onChange={(e) => onChange('databases', parseInt(e.target.value) || 0)}
            className="input"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('databaseLimitDesc')}</p>
        </div>
      </div>
    </div>
  );
}


