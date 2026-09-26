import React, { useMemo, useState } from 'react';
import { Plus, Save, Settings, X, Loader2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useTranslations } from 'next-intl';
import { useAdminTicketCategories } from '@/hooks/admin/tickets/useAdminTicketCategories';
import { TicketCategoriesList } from './TicketCategoriesList';

interface TicketSettingsProps {
  onClose: () => void;
}

export function TicketSettings({ onClose }: TicketSettingsProps) {
  const { categories, loading, saving, addCategory, removeCategory, save } = useAdminTicketCategories();
  const [newCategory, setNewCategory] = useState('');

  const t = useTranslations('AdminTickets');
  const tCommon = useTranslations('Common');

  const normalizedNewCategory = newCategory.trim();
  const canAdd = normalizedNewCategory.length > 0 && normalizedNewCategory.length <= 32;

  const categoryExists = useMemo(() => {
    return categories.some(
      (category) => category.name.toLowerCase() === normalizedNewCategory.toLowerCase()
    );
  }, [categories, normalizedNewCategory]);

  const handleAdd = () => {
    if (!canAdd || categoryExists) return;
    const added = addCategory(normalizedNewCategory);
    if (added) setNewCategory('');
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t('ticketSettings')}
      subtitle={t('manageTicketCategories')}
      icon={<Settings className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            onClick={save}
            disabled={saving || loading}
            className={`flex w-full sm:w-auto min-w-[145px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-semibold transition-all ${
              saving || loading
                ? 'bg-[#161616] text-[#888] cursor-not-allowed'
                : 'bg-[#FF5722] text-white hover:bg-[#FF6B32] hover:-translate-y-[1px]'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? t('saving') : tCommon('saveChanges')}</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col min-h-0 space-y-8 animate-in fade-in duration-300 pointer-events-none">
          <section>
            <div className="h-5 w-32 rounded bg-white/[0.05] animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-white/[0.03] animate-pulse" />
            <div className="mt-5 flex gap-3">
              <div className="h-[42px] flex-1 rounded-lg bg-white/[0.04] animate-pulse" />
              <div className="h-[42px] w-[88px] rounded-lg bg-white/[0.04] animate-pulse" />
            </div>
          </section>

          <section>
            <div className="h-5 w-40 rounded bg-white/[0.05] animate-pulse" />
            <div className="mt-2 mb-6 h-4 w-72 rounded bg-white/[0.03] animate-pulse" />
            <div className="divide-y divide-white/[0.06]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-1 gap-4 px-2 py-5 md:grid-cols-[30px_1.5fr_1fr_70px] md:items-center">
                  <div className="h-3.5 w-28 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-3.5 w-8 rounded bg-white/[0.05] animate-pulse" />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col min-h-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* ADD CATEGORY */}
          <section>
            <h2 className="text-base font-semibold text-white">{t('addCategory')}</h2>
            <p className="mt-0.5 text-sm text-[#888]">{t('createCategoryDesc')}</p>

            <div className="mt-5 flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newCategory}
                  maxLength={32}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder={t('egTechnical')}
                  className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                />
                {newCategory && (
                  <button
                    onClick={() => setNewCategory('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                disabled={!canAdd || categoryExists}
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
                <span>{tCommon('add')}</span>
              </button>
            </div>
            {categoryExists && <p className="mt-1.5 text-xs text-red-400">{t('categoryAlreadyExists')}</p>}
            {!categoryExists && normalizedNewCategory.length > 0 && normalizedNewCategory.length < 3 && (
              <p className="mt-1.5 text-xs text-[#888]">{t('useAtLeast3Chars')}</p>
            )}
          </section>

          {/* CATEGORIES LIST */}
          <TicketCategoriesList categories={categories} onRemoveCategory={removeCategory} />
        </div>
      )}
    </Drawer>
  );
}

export default TicketSettings;
