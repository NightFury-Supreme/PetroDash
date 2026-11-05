'use client';

import React from 'react';
import { Settings, Trash } from 'lucide-react';
import { RowActionButton } from '@/components/ui/RowActionButton';
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
        <RowActionButton
          variant="default"
          onClick={() => onEdit(egg.id)}
          title={t('editEggTitle')}
        >
          <Settings size={15} />
        </RowActionButton>
        <RowActionButton
          variant="danger"
          onClick={(e) => {
            if (inUse) {
              e.preventDefault();
              return;
            }
            onDelete(egg.id);
          }}
          disabled={inUse}
          title={inUse ? t('cannotDeleteEggInUse') : t('deleteEgg')}
        >
          <Trash size={15} />
        </RowActionButton>
      </div>
    </div>
  );
}

export default EggRowActions;
