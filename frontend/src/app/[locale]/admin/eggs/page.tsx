/* ==========================================================================
   Admin Eggs Management Page
   Compliance: ISO/IEC 25010, Module Encapsulation (<300 lines)
========================================================================== */

'use client';

import { useState, useMemo } from 'react';
import { Search, X, Egg, Box, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  EggsHeader,
  EggList,
  AdminEggFilters,
  AdminEggActiveFilters,
  CreateEggDrawer,
  EditEggDrawer,
} from '@/components/admin/eggs';
import AdminEggsSkeleton from '@/components/skeletons/admin/eggs/AdminEggsSkeleton';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { useAdminEggs } from '@/hooks/admin/eggs';
import type { EggCategory } from '@/components/admin/eggs/types';

export default function EggsListPage() {
  const t = useTranslations('admin.eggs');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const { eggs, loading, error, fetchEggs, deleteEgg } = useAdminEggs();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEggId, setEditingEggId] = useState<string | null>(null);
  const [deletingEggId, setDeletingEggId] = useState<string | null>(null);

  const categoryObjects: EggCategory[] = useMemo(() => {
    const map = new Map<string, EggCategory>();
    for (const e of eggs) {
      const id = e.category;
      const name = e.categoryName || tCommon('uncategorized');
      if (!id) continue;
      if (map.has(id)) {
        map.get(id)!.eggCount += 1;
      } else {
        map.set(id, { id, name, eggCount: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [eggs, tCommon]);

  const categories = useMemo(() => categoryObjects.map((c) => c.name), [categoryObjects]);

  const activeFilterCount = categoryFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setCategoryFilter('all');
  const removeFilter = () => setCategoryFilter('all');

  const filteredEggs = useMemo(() => {
    let result = eggs;
    if (categoryFilter !== 'all') {
      result = result.filter((e) => {
        const cat = e.categoryName || tCommon('uncategorized');
        return cat === categoryFilter;
      });
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.name.toLowerCase().includes(lower) ||
        (e.categoryName && e.categoryName.toLowerCase().includes(lower)) ||
        e.pterodactylEggId.toString().includes(lower) ||
        e.pterodactylNestId.toString().includes(lower)
      );
    }
    return result;
  }, [eggs, searchQuery, categoryFilter, tCommon]);

  const handleExecuteDelete = async (id: string) => {
    await deleteEgg(id);
    setDeletingEggId(null);
  };

  if (error) {
    const displayError = tErrorBackend.has(error) ? tErrorBackend(error) : error;
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Box strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t('loadErrorKicker')}
          title={t('failedToLoad')}
          errorString={displayError}
          description={<ErrorDescription error={displayError} topic={tCommon('eggs')} />}
          buttons={
            <>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('retry')}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  if (loading) {
    return <AdminEggsSkeleton />;
  }

  const eggToDelete = eggs.find((e) => e._id === deletingEggId);

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        <EggsHeader onNewClick={() => setIsDrawerOpen(true)} />

        <section className="mt-[25px]">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
              <Search size={15} />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
                  aria-label={tCommon('clearSearch')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-[7px] w-full sm:w-auto">
              <AdminEggFilters
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories}
                activeFilterCount={activeFilterCount}
                clearFilters={clearFilters}
              />
            </div>
          </div>

          <AdminEggActiveFilters
            activeFilterCount={activeFilterCount}
            categoryFilter={categoryFilter}
            removeFilter={removeFilter}
            clearFilters={clearFilters}
          />
        </section>

        <EggList
          eggs={filteredEggs}
          onEdit={(id) => setEditingEggId(id)}
          onDelete={(id) => setDeletingEggId(id)}
        />
      </div>

      {isDrawerOpen && (
        <CreateEggDrawer
          onClose={() => setIsDrawerOpen(false)}
          onSuccess={() => {
            setIsDrawerOpen(false);
            fetchEggs();
          }}
          preloadedCategories={categoryObjects}
        />
      )}

      {editingEggId && (
        <EditEggDrawer
          eggId={editingEggId}
          onClose={() => setEditingEggId(null)}
          onUpdate={() => {
            setEditingEggId(null);
            fetchEggs();
          }}
          preloadedCategories={categoryObjects}
        />
      )}

      <DeleteDrawer
        isOpen={Boolean(deletingEggId)}
        onClose={() => setDeletingEggId(null)}
        onConfirm={async () => {
          if (deletingEggId) await handleExecuteDelete(deletingEggId);
        }}
        entityType={tCommon('egg')}
        entityName={eggToDelete?.name || ''}
        entitySubText={
          eggToDelete
            ? `${t('nestId')}: ${eggToDelete.pterodactylNestId} | ${t('eggId')}: ${eggToDelete.pterodactylEggId}`
            : ''
        }
        icon={
          eggToDelete?.icon ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${eggToDelete.icon}`}
              alt={eggToDelete.name}
              className="w-10 h-10 object-contain rounded"
            />
          ) : (
            <Egg size={24} />
          )
        }
        warningPoints={[
          t('deleteWarning1'),
          t('deleteWarning2'),
          t('deleteWarning3'),
        ]}
      />
    </div>
  );
}
