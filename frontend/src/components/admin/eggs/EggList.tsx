'use client';

import React from 'react';
import { Egg, Server, Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusIndicator, SafeImage } from '@/components/ui';
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
            <div className="hidden gap-4 lg:grid lg:grid-cols-[2fr_100px_100px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20">
              <span>{t('eggName')}</span>
              <span>{t('nestId')}</span>
              <span>{t('eggId')}</span>
              <span>{t('servers')}</span>
              <span className="text-right">{t('actions')}</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {groupedEggs[category].map((egg) => (
                <div
                  key={egg.id}
                  className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid-cols-[2fr_100px_100px_80px_100px] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('eggName')}
                    </p>
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={egg.icon ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${egg.icon}` : null}
                        alt={egg.name}
                        className="w-6 h-6 rounded object-contain shrink-0"
                        fallback={<Egg size={16} className="text-[#888] shrink-0" />}
                      />
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
                            <StatusIndicator status="recommended" label={t('recommended')} size="sm" />
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

                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('nestId')}
                    </p>
                    <span className="truncate text-sm font-mono text-[#D4D4D4]">
                      {egg.pterodactylNestId}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('eggId')}
                    </p>
                    <span className="truncate text-sm font-mono text-[#D4D4D4]">
                      {egg.pterodactylEggId}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:hidden">
                      {t('servers')}
                    </p>
                    <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
                      <Server size={14} strokeWidth={1.5} className="text-white" />
                      <span className="truncate">{egg.serversCount || 0}</span>
                    </div>
                  </div>

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
