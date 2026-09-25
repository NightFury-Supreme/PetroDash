/* ==========================================================================
   Admin Egg List Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Egg, Server, Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminEgg } from './types';
import { EggRowActions } from './EggRowActions';

interface EggListProps {
  eggs: AdminEgg[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EggList({ eggs, onEdit, onDelete }: EggListProps) {
  const t = useTranslations('admin.eggs');
  const tCommon = useTranslations('Common');

  if (!eggs || eggs.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#666]">
        {t('noEggsFound')}
      </div>
    );
  }

  // Group eggs by categoryName
  const groupedEggs = eggs.reduce((acc, egg) => {
    const categoryName = egg.categoryName || tCommon('uncategorized');
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(egg);
    return acc;
  }, {} as Record<string, AdminEgg[]>);

  const categories = Object.keys(groupedEggs).sort();

  return (
    <div className="w-full space-y-10">
      {categories.map((category) => (
        <div key={category} className="w-full">
          <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
            {category}
          </h2>

          <div className="w-full">
            {/* Desktop Table Header */}
            <div className="hidden gap-4 lg:grid lg:grid-cols-[2fr_100px_100px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20">
              <span>{t('eggName')}</span>
              <span>{t('nestId')}</span>
              <span>{t('eggId')}</span>
              <span>{t('servers')}</span>
              <span className="text-right">{t('actions')}</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/[0.06]">
              {groupedEggs[category].map((egg) => (
                <div
                  key={egg._id}
                  className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid-cols-[2fr_100px_100px_80px_100px] lg:items-center"
                >
                  {/* Egg Name & Details */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('eggName')}
                    </p>
                    <div className="flex items-center gap-3">
                      {egg.icon ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${egg.icon}`}
                          alt={egg.name}
                          className="w-6 h-6 rounded object-contain shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Egg size={16} className="text-[#888] shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="block truncate font-mono text-sm text-[#DDDDDD]">
                            {egg.name}
                          </span>
                          {egg.allowedPlanNames && egg.allowedPlanNames.length > 0 && (
                            <div
                              title={`${t('requiresPlan')}: ${egg.allowedPlanNames.join(', ')}`}
                              className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                            >
                              <Crown size={14} fill="currentColor" />
                            </div>
                          )}
                          {egg.recommended && (
                            <span className="inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                              {t('recommended')}
                            </span>
                          )}
                        </div>
                        {egg.description && (
                          <span className="truncate text-[10px] text-[#555]">
                            {egg.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nest ID */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('nestId')}
                    </p>
                    <span className="truncate text-sm font-mono text-[#D4D4D4]">
                      {egg.pterodactylNestId}
                    </span>
                  </div>

                  {/* Egg ID */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('eggId')}
                    </p>
                    <span className="truncate text-sm font-mono text-[#D4D4D4]">
                      {egg.pterodactylEggId}
                    </span>
                  </div>

                  {/* Servers Count */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('servers')}
                    </p>
                    <div className="flex items-center gap-1.5 font-medium text-[#E0E0E0] text-sm">
                      <Server size={14} className="text-[#FF5722]" />
                      <span className="truncate">{egg.serversCount || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <EggRowActions egg={egg} onEdit={onEdit} onDelete={onDelete} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EggList;
