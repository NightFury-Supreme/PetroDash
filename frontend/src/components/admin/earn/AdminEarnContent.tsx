/**
 * Admin Earn Content Component
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

'use client';

import React, { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminEarnSettings } from '@/hooks/admin/earn/useAdminEarn';
import { EarnMethodRow } from './EarnMethodRow';
import { LinkvertiseConfigDrawer } from './drawers';

export interface AdminEarnContentProps {
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: unknown) => void;
  onSaveLinkvertise: (override?: { enabled: boolean }) => Promise<void>;
}

export function AdminEarnContent({
  form,
  saving,
  onChange,
  onSaveLinkvertise,
}: AdminEarnContentProps) {
  const t = useTranslations('admin.earn');
  const tCommon = useTranslations('Common');
  const [editing, setEditing] = useState<'linkvertise' | null>(null);
  const cols = 'lg:grid-cols-[1.5fr_2fr_100px_100px_100px_80px]';

  return (
    <div className="mt-8">
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div
          className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}
        >
          <span>{t('table.method')}</span>
          <span>{t('table.description')}</span>
          <span>{t('table.reward')}</span>
          <span>{t('table.dailyLimit')}</span>
          <span>{t('table.status')}</span>
          <span className="text-right">{t('table.actions')}</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-[#222]">
          <EarnMethodRow
            methodName={t('linkvertise.name')}
            methodSubtitle={t('linkvertise.subtitle')}
            icon={<LinkIcon size={18} />}
            description={t('linkvertise.description')}
            rewardStr={`${form.linkvertise?.coins || 0} ${tCommon('coins')}`}
            limitStr={`${form.linkvertise?.maxClaimsPerDay || 0} ${tCommon('claims')}`}
            enabled={form.linkvertise?.enabled || false}
            cols={cols}
            onEdit={() => setEditing('linkvertise')}
          />
        </div>
      </div>

      <LinkvertiseConfigDrawer
        isOpen={editing === 'linkvertise'}
        onClose={() => setEditing(null)}
        form={form}
        saving={saving}
        onChange={onChange}
        onSaveLinkvertise={onSaveLinkvertise}
      />
    </div>
  );
}
