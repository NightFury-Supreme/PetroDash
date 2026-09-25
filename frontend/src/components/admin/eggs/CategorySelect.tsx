/* ==========================================================================
   Admin Egg Category Select Component
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Loader2, Trash2, Edit2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAdminEggCategories } from '@/hooks/admin/eggs';
import type { EggCategory } from './types';

interface CategorySelectProps {
  value: string;
  onChange: (v: string) => void;
  initialCategories?: EggCategory[];
}

export function CategorySelect({ value, onChange, initialCategories }: CategorySelectProps) {
  const t = useTranslations('admin.eggs');
  const tCommon = useTranslations('Common');

  const {
    categories,
    loading,
    createCategory,
    renameCategory,
    deleteCategory,
  } = useAdminEggCategories(initialCategories);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [newCat, setNewCat] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleCreate = async () => {
    if (!newCat.trim()) return;
    setLocalError(null);
    try {
      const cat = await createCategory(newCat.trim());
      onChange(cat.id);
      setNewCat('');
      setIsCreating(false);
      setIsOpen(false);
    } catch {
      setLocalError(t('failedToCreateCategory'));
    }
  };

  const handleRename = async (id: string) => {
    if (!editVal.trim()) return;
    setLocalError(null);
    try {
      await renameCategory(id, editVal.trim());
      setEditingId(null);
    } catch {
      setLocalError(t('failedToRenameCategory'));
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLocalError(null);
    try {
      await deleteCategory(id);
      if (value === id) onChange('');
    } catch {
      setLocalError(t('failedToDeleteCategory'));
    }
  };

  const buttonClass = isOpen
    ? 'bg-[#222] border-[#222] text-[#ddd]'
    : 'bg-[#101010] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#FF5722]/50 hover:text-[#ddd]';

  const selectedCat = categories.find((c) => c.id === value || c.name === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !isCreating && !editingId && setIsOpen(!isOpen)}
        className={`w-full rounded-md border px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center transition-colors outline-none ${buttonClass}`}
      >
        <span>{selectedCat ? selectedCat.name : <span className="text-[#858585]">{t('selectCategory')}</span>}</span>
        <ChevronDown size={14} className={`text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full border border-[#2A2A2A] rounded-md bg-[#151515] p-1.5 shadow-xl max-h-64 overflow-y-auto">
          {localError && (
            <div className="px-2 py-1 mb-1 text-[11px] text-red-400 bg-red-500/10 rounded">
              {localError}
            </div>
          )}

          {!isCreating && !editingId ? (
            <div className="flex flex-col gap-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-[#FF5722]/10 hover:text-[#FF5722] text-[#D4D4D4] cursor-pointer group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[#888]">
                      {c.eggCount} {t('eggsCountLabel')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(c.id);
                        setEditVal(c.name);
                      }}
                      className="text-[#888] hover:text-[#D4D4D4] transition-colors p-1"
                      title={t('renameCategory')}
                    >
                      <Edit2 size={13} />
                    </button>
                    {c.eggCount === 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, c.id)}
                        className="text-[#888] hover:text-[#ef4444] transition-colors p-1"
                        title={tCommon('delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="px-2 py-2 text-xs text-[#858585] italic">{t('noCategories')}</div>
              )}
              <div className="h-[1px] bg-[#2A2A2A] my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsCreating(true);
                  setLocalError(null);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-[#FF5722]/10 hover:text-[#FF5722] text-[#FF5722] cursor-pointer"
              >
                <Plus size={14} /> {t('createCategory')}
              </button>
            </div>
          ) : isCreating ? (
            <div className="p-2 bg-[#151515] flex flex-col gap-2">
              <input
                autoFocus
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder={t('newCategoryPlaceholder')}
                className="w-full h-8 rounded-md border border-[#2A2A2A] bg-[#101010] px-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]/50 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading || !newCat.trim()}
                  className="flex-1 h-7 bg-[#FF5722] text-white text-xs font-medium rounded-md flex justify-center items-center hover:bg-[#F4511E] transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : tCommon('save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCat('');
                  }}
                  disabled={loading}
                  className="flex-1 h-7 bg-[#222] border border-[#2A2A2A] text-[#D4D4D4] text-xs font-medium rounded-md hover:bg-[#2A2A2A] transition-colors"
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-[#151515] flex flex-col gap-2">
              <div className="text-xs text-[#858585] px-1">{t('renameCategory')}</div>
              <input
                autoFocus
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => editingId && e.key === 'Enter' && handleRename(editingId)}
                placeholder={t('categoryPlaceholder')}
                className="w-full h-8 rounded-md border border-[#2A2A2A] bg-[#101010] px-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]/50 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => editingId && handleRename(editingId)}
                  disabled={loading || !editVal.trim()}
                  className="flex-1 h-7 bg-[#FF5722] text-white text-xs font-medium rounded-md flex justify-center items-center hover:bg-[#F4511E] transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : tCommon('save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditVal('');
                  }}
                  disabled={loading}
                  className="flex-1 h-7 bg-[#222] border border-[#2A2A2A] text-[#D4D4D4] text-xs font-medium rounded-md hover:bg-[#2A2A2A] transition-colors"
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CategorySelect;
