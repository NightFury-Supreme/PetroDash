'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';
import type { LocationOption, EggOption } from '@/hooks/admin/servers';

interface AdminClearQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (locationId: string, eggId: string) => Promise<void>;
  locations: LocationOption[];
  eggs: EggOption[];
}

export function AdminClearQueueDrawer({
  isOpen,
  onClose,
  onConfirm,
  locations,
  eggs,
}: AdminClearQueueDrawerProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');

  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedEgg, setSelectedEgg] = useState('all');
  const [confirmText, setConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setSelectedLocation('all');
      setSelectedEgg('all');
      setIsClearing(false);
    }
  }, [isOpen]);

  const expectedConfirmText = t('clearText');

  const handleConfirm = async () => {
    if (confirmText.trim().toLowerCase() !== expectedConfirmText.toLowerCase()) return;
    setIsClearing(true);
    try {
      await onConfirm(selectedLocation, selectedEgg);
      onClose();
    } catch {
      setIsClearing(false);
    }
  };

  const isConfirmDisabled = confirmText.trim().toLowerCase() !== expectedConfirmText.toLowerCase();
  const isFiltering = selectedLocation !== 'all' || selectedEgg !== 'all';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('clearQueueTitle')}
      subtitle={t('clearQueueSubtitle')}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isClearing}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              isConfirmDisabled || isClearing
                ? 'bg-[#161616] border border-[#222] text-[#888] cursor-not-allowed'
                : 'bg-red-500 border border-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isClearing ? (
              <><Loader2 size={16} className="animate-spin" /> {tCommon('clearing')}</>
            ) : (
              <><X size={16} /> {t('clearQueueTitle')}</>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-[#666] text-[10px] font-semibold uppercase tracking-[0.05em]">{t('targetNode')}</label>
          <SelectDropdown
            value={selectedLocation}
            onChange={setSelectedLocation}
            options={[
              { label: t('allNodes'), value: 'all' },
              ...locations.map((loc) => ({ label: loc.name, value: loc.id })),
            ]}
            className="w-full"
            buttonClassName="h-10 text-xs bg-[#161616] border border-[#2A2A2A] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
            menuClassName="bg-[#161616] border border-[#2A2A2A]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#666] text-[10px] font-semibold uppercase tracking-[0.05em]">{t('targetEgg')}</label>
          <SelectDropdown
            value={selectedEgg}
            onChange={setSelectedEgg}
            options={[
              { label: t('allEggs'), value: 'all' },
              ...eggs.map((egg) => ({ label: egg.name, value: egg.id })),
            ]}
            className="w-full"
            buttonClassName="h-10 text-xs bg-[#161616] border border-[#2A2A2A] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
            menuClassName="bg-[#161616] border border-[#2A2A2A]"
          />
        </div>
      </div>

      <div className="border-l-2 border-red-500 pl-4 py-1 mb-6">
        <div className="flex items-center gap-2 text-red-500 mb-3">
          <AlertTriangle size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">{t('beforeYouContinue')}</span>
        </div>
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5 text-xs text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
            <span>
              {isFiltering
                ? t('removeFilteredWarning')
                : t('removeAllWarning')}
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
            <span>{t('recreateWarning')}</span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
            <span>{t('cannotUndo')}</span>
          </li>
        </ul>
      </div>

      <div className="pt-6 border-t border-white/[0.06]">
        <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-2">
          {t.rich('typeToConfirm', {
            clear: expectedConfirmText.toUpperCase(),
            confirm: (chunks) => <span className="text-white font-semibold">{chunks}</span>,
          })}
        </label>
        <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-red-500 transition-colors">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={expectedConfirmText.toUpperCase()}
            className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-600 font-mono"
          />
        </div>
      </div>
    </Drawer>
  );
}
