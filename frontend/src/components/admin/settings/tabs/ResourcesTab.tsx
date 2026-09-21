import React from 'react';
import { Server, Cpu, MemoryStick, HardDrive, Archive, Network, Database, Coins } from 'lucide-react';
import { SettingsRow } from '../Shared';
import { TabProps, Settings } from '../types';
import { useTranslations } from 'next-intl';

export function ResourcesTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  const t = useTranslations('AdminSettings');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('defaultResourcesTitle')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('defaultResourcesDesc')}</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {([
            ['cpuPercent', t('cpuPercent'), t('cpuPercentDesc')],
            ['memoryMb', t('memoryMb'), t('memoryMbDesc')],
            ['diskMb', t('diskMb'), t('diskMbDesc')],
            ['serverSlots', t('serverSlots'), t('serverSlotsDesc')],
            ['backups', t('backups'), t('backupsDesc')],
            ['allocations', t('allocations'), t('allocationsDesc')],
            ['databases', t('databases'), t('databasesDesc')],
            ['coins', t('coins'), t('coinsDesc')]
          ] as [keyof Settings['defaults'], string, string][]).map(([key, label, tooltip]) => (
              <SettingsRow 
                key={key} 
                icon={
                  key === 'cpuPercent' ? <Cpu /> : 
                  key === 'memoryMb' ? <MemoryStick /> : 
                  key === 'diskMb' ? <HardDrive /> : 
                  key === 'serverSlots' ? <Server /> : 
                  key === 'backups' ? <Archive /> : 
                  key === 'allocations' ? <Network /> : 
                  key === 'databases' ? <Database /> : 
                  key === 'coins' ? <Coins /> : 
                  <Server />
                } 
                label={label} 
                description={tooltip} 
                displayValue={formData.defaults?.[key]} 
                onSave={() => saveSection({ defaults: formData.defaults }, t('defaultResourcesUpdated'))}
              >
              <input
                type="number"
                min="0"
                className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
                value={formData.defaults?.[key] || 0}
                onChange={(e) => updateFormData(`defaults.${key}`, Number(e.target.value))}
                disabled={loading}
              />
            </SettingsRow>
          ))}
        </div>
      </section>
    </div>
  );
}
