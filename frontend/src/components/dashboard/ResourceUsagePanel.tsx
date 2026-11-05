import React from 'react';
import { BarChart2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ResourceUsage, ResourceLimits } from './types';

interface ProgressBarProps {
  label: string;
  percentage: number;
  valueText: string;
  color?: string;
}

function SegmentedProgressBar({ label, percentage, valueText, color = '#FF5722' }: ProgressBarProps) {
  const totalSegments = 40;
  const filledSegments = Math.round((percentage / 100) * totalSegments);

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between text-xs font-medium mb-2">
        <span className="text-[#AAAAAA]">{label}</span>
        <span className="text-[#FF5722]">{valueText}</span>
      </div>
      <div className="flex gap-[2px] h-3">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-[1px] transition-colors"
            style={{
              backgroundColor: i < filledSegments ? color : '#2A2A2A',
              opacity: i < filledSegments ? 1 : 0.5
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ResourceUsagePanelProps {
  usage: ResourceUsage | null;
  resources: ResourceLimits | null;
}

export function ResourceUsagePanel({ usage, resources }: ResourceUsagePanelProps) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');

  const dbLimit = resources?.databases || 0;
  const dbUsage = usage?.databases || 0;
  const dbPercent = dbLimit > 0 ? Math.round((dbUsage / dbLimit) * 100) : 0;

  const portLimit = resources?.allocations || 0;
  const portUsage = usage?.allocations || 0;
  const portPercent = portLimit > 0 ? Math.round((portUsage / portLimit) * 100) : 0;

  const backupLimit = resources?.backups || 0;
  const backupUsage = usage?.backups || 0;
  const backupPercent = backupLimit > 0 ? Math.round((backupUsage / backupLimit) * 100) : 0;

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-[#888888]">
          <BarChart2 size={16} />
          <span className="font-medium text-sm tracking-wide text-white">{tCommon('resource')}</span>
        </div>
      </div>

      <div className="flex-1">
        <SegmentedProgressBar label={t('databases')} percentage={dbPercent} valueText={`${dbUsage} / ${dbLimit}`} />
        <SegmentedProgressBar label={t('ports')} percentage={portPercent} valueText={`${portUsage} / ${portLimit}`} />
        <SegmentedProgressBar label={t('backups')} percentage={backupPercent} valueText={`${backupUsage} / ${backupLimit}`} />
      </div>
    </div>
  );
}
