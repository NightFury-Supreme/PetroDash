/**
 * Location List Component
 */

'use client';

import React from 'react';
import { Globe, Settings, Server, Trash, Crown } from 'lucide-react';
import { RowActionButton } from '@/components/ui/RowActionButton';
import { useTranslations } from 'next-intl';
import type { AdminLocation } from './types';

interface LocationListProps {
  locations: AdminLocation[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LocationList({ locations, onEdit, onDelete }: LocationListProps) {
  const t = useTranslations('admin.locations');

  if (!locations || locations.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#666]">
        {t('table.noLocationsFound')}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[2fr_120px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20">
        <span>{t('table.locationName')}</span>
        <span>{t('table.serverLimit')}</span>
        <span>{t('table.servers')}</span>
        <span className="text-right">{t('table.actions')}</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {locations.map((loc) => {
          const serversCount = loc.serversCount ?? 0;
          const isInUse = serversCount > 0;

          return (
            <div
              key={loc._id}
              className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid-cols-[2fr_120px_80px_100px] lg:items-center"
            >
              {/* Location Name */}
              <div className="min-w-0">
                <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                  {t('table.locationName')}
                </p>
                <div className="flex items-center gap-3">
                  {loc.flag ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${loc.flag}`}
                      alt={loc.name}
                      className="w-6 h-6 rounded object-contain shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe size={16} className="text-[#888] shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="block truncate font-mono text-sm text-[#DDDDDD]">{loc.name}</span>
                      {loc.allowedPlanNames && loc.allowedPlanNames.length > 0 && (
                        <div
                          title={`${t('table.requiresPlan')} ${loc.allowedPlanNames.join(', ')}`}
                          className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                        >
                          <Crown size={14} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    {loc.latencyUrl && (
                      <p className="mt-0.5 truncate text-xs text-[#888]">{loc.latencyUrl}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Server Limit */}
              <div className="min-w-0 lg:text-left">
                <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                  {t('table.serverLimit')}
                </p>
                <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
                  <span>
                    {loc.serverLimit === 0 ? t('table.unlimited') : loc.serverLimit}
                  </span>
                </div>
              </div>

              {/* Servers count */}
              <div className="min-w-0 lg:text-left">
                <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                  {t('table.servers')}
                </p>
                <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
                  <Server size={14} className="text-[#FF5722]" />
                  <span className="truncate">{serversCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
                <div className="flex lg:justify-end gap-2">
                  <RowActionButton
                    variant="default"
                    onClick={() => onEdit(loc._id)}
                    title={t('table.editLocationTitle')}
                  >
                    <Settings size={15} />
                  </RowActionButton>
                  <RowActionButton
                    variant="danger"
                    onClick={(e) => {
                      if (isInUse) {
                        e.preventDefault();
                        return;
                      }
                      onDelete(loc._id);
                    }}
                    disabled={isInUse}
                    title={isInUse ? t('table.cannotDeleteInUse') : t('table.deleteLocationTitle')}
                  >
                    <Trash size={15} />
                  </RowActionButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LocationList;
