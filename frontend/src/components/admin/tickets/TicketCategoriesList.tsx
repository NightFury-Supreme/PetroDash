import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/hooks/admin/tickets/useAdminTicketCategories';

interface TicketCategoriesListProps {
  categories: Category[];
  onRemoveCategory: (id: string) => void;
}

export function TicketCategoriesList({ categories, onRemoveCategory }: TicketCategoriesListProps) {
  const t = useTranslations('AdminTickets');
  const tCommon = useTranslations('Common');

  return (
    <section>
      <div className="flex items-center justify-between mb-0.5">
        <h2 className="text-base font-semibold text-white">{t('currentCategories')}</h2>
      </div>
      <p className="mt-0.5 text-sm text-[#888] mb-6">{t('organizeIncomingTickets')}</p>

      <div>
        <div className="hidden gap-4 grid-cols-[30px_1.5fr_1fr_70px] border-b border-white/[0.06] px-2 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
          <span>#</span>
          <span>{t('categoryName')}</span>
          <span>{t('tickets')}</span>
          <span className="text-right">{tCommon('action')}</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#666]">{t('noCategoriesDefined')}</div>
          ) : (
            categories.map((category, index) => {
              const canRemove = category.ticketCount === 0;

              return (
                <div
                  key={category.id}
                  className="group grid grid-cols-1 gap-4 px-2 py-5 transition hover:bg-white/[0.015] md:grid-cols-[30px_1.5fr_1fr_70px] md:items-center"
                >
                  <div className="min-w-0 hidden md:block">
                    <span className="block font-mono text-[10px] text-white/35">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('categoryName')}</p>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium text-white/70">
                        {category.name}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('tickets')}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/70">
                        {category.ticketCount}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 md:text-right">
                    <button
                      disabled={!canRemove}
                      onClick={() => onRemoveCategory(category.id)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus:outline-none disabled:cursor-not-allowed ${
                        canRemove
                          ? 'text-[#888] hover:bg-red-500/10 hover:text-red-400 focus:ring-2 focus:ring-red-400/30'
                          : 'text-white/20 opacity-50'
                      }`}
                      title={canRemove ? t('removeCategory', { name: category.name }) : t('categoryInUse')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
