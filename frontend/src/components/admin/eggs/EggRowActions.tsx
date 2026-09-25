/* ==========================================================================
   Admin Egg Row Actions Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Settings, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminEgg } from './types';

interface EggRowActionsProps {
  egg: AdminEgg;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EggRowActions({ egg, onEdit, onDelete }: EggRowActionsProps) {
  const t = useTranslations('admin.eggs');
  const inUse = (egg.serversCount || 0) > 0;

  return (
    <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
      <div className="flex lg:justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(egg._id)}
          className="bg-white/5 border border-white/5 rounded p-1.5 text-[#888] hover:bg-white/10 hover:text-[#ddd] transition-colors"
          title={t('editEggTitle')}
        >
          <Settings size={15} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (inUse) {
              e.preventDefault();
              return;
            }
            onDelete(egg._id);
          }}
          disabled={inUse}
          className={`border rounded p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            inUse
              ? 'bg-red-500/0 border-transparent text-red-500/30'
              : 'bg-red-500/5 border-red-500/10 text-red-500/70 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500'
          }`}
          title={inUse ? t('cannotDeleteEggInUse') : t('deleteEgg')}
        >
          <Trash size={15} />
        </button>
      </div>
    </div>
  );
}

export default EggRowActions;
