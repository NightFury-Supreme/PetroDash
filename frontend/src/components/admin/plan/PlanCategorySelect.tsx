"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Loader2, Trash2, Edit2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useAdminPlanCategories, type PlanCategory } from '@/hooks/admin/plan';

export function PlanCategorySelect({
  value,
  onChange,
  initialCategories,
}: {
  value: string;
  onChange: (v: string) => void;
  initialCategories?: PlanCategory[];
}) {
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [newCat, setNewCat] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const {
    categories,
    loading,
    createCategory,
    renameCategory,
    deleteCategory,
  } = useAdminPlanCategories(initialCategories);

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
    const created = await createCategory(newCat.trim());
    if (created) {
      onChange(created.id);
      setNewCat('');
      setIsCreating(false);
      setIsOpen(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editVal.trim()) return;
    const ok = await renameCategory(id, editVal.trim());
    if (ok) {
      setEditingId(null);
      setEditVal('');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await deleteCategory(id);
    if (ok && value === id) {
      onChange('');
    }
  };

  const buttonClass = isOpen
    ? 'bg-[#1A1A1A] border-[#FF5722] text-white' 
    : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#FF5722]/50 hover:text-white';

  const selectedCat = categories.find((c) => c.id === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        onClick={() => !isCreating && !editingId && setIsOpen(!isOpen)}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center transition-colors outline-none ${buttonClass}`}
      >
        {selectedCat ? selectedCat.name : <span className="text-[#858585]">{t('selectCategory')}</span>}
        <ChevronDown size={14} className={`text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full border border-[#2A2A2A] rounded-md bg-[#151515] p-1.5 shadow-xl max-h-64 overflow-y-auto">
          {!isCreating && !editingId ? (
            <div className="flex flex-col gap-1">
              {categories.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => { onChange(c.id); setIsOpen(false); }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors cursor-pointer group ${c.id === value ? 'bg-white/10 text-white' : 'text-[#D4D4D4] hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[#888]">{c.planCount} {t('plans')}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditVal(c.name); }}
                      className="text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent border border-[#222] rounded-lg"
                      title={t('rename')}
                    >
                      <Edit2 size={13} />
                    </button>
                    {c.planCount === 0 && (
                      <button 
                        onClick={(e) => handleDelete(e, c.id)}
                        className="text-[#888] hover:text-[#ef4444] transition-colors"
                        title={tCommon('delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="px-2 py-2 text-xs text-[#858585] italic">{t('noCategoriesFound')}</div>
              )}
              <div className="h-[1px] bg-[#2A2A2A] my-1" />
              <div 
                onClick={() => { setIsCreating(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors hover:bg-white/5 hover:text-white text-[#D4D4D4] cursor-pointer mt-1"
              >
                <Plus size={14} /> {t('createNewCategory')}
              </div>
            </div>
          ) : isCreating ? (
            <div className="p-2 bg-[#151515] flex flex-col gap-2">
              <input 
                autoFocus
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder={t('newCategoryName')}
                className="w-full h-8 rounded-md border border-[#2A2A2A] bg-[#101010] px-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]/50 transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleCreate}
                  disabled={loading || !newCat.trim()}
                  className="flex-1 h-7 bg-[#FF5722] text-white text-xs font-medium rounded-md flex justify-center items-center hover:bg-[#F4511E] transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : tCommon('save')}
                </button>
                <button 
                  onClick={() => { setIsCreating(false); setNewCat(''); }}
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
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename(editingId!)}
                placeholder={t('categoryName')}
                className="w-full h-8 rounded-md border border-[#2A2A2A] bg-[#101010] px-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]/50 transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRename(editingId!)}
                  disabled={loading || !editVal.trim()}
                  className="flex-1 h-7 bg-[#FF5722] text-white text-xs font-medium rounded-md flex justify-center items-center hover:bg-[#F4511E] transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : tCommon('save')}
                </button>
                <button 
                  onClick={() => { setEditingId(null); setEditVal(''); }}
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
