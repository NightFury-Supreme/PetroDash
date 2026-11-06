"use client";

import { useState, useMemo } from 'react';
import { CreditCard, RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { useToast } from "@/components/ui/ToastProvider";
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { AdminStorePlansSkeleton } from '@/components/skeletons/admin/store';
import { usePlansList, Plan } from '@/hooks/admin/plan/usePlansList';
import { PlansList } from '@/components/admin/plan/PlansList';
import { PlanDrawer } from '@/components/admin/plan/PlanDrawer';
import { AdminPlanActiveFilters } from '@/components/admin/plan/AdminPlanActiveFilters';
import { AdminPlansSearchBar } from '@/components/admin/plan/AdminPlansSearchBar';
import { useTranslations } from 'next-intl';

export default function AdminPlansTab() {
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showSuccess, showError } = useToast();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const {
    plans,
    loading,
    error,
    deleting,
    page,
    setPage,
    totalPages,
    totalItems,
    deletePlan,
    toggleEnabled,
    makeUnlisted,
    makePublic,
    loadPlans,
  } = usePlansList();

  const handleDelete = async (planId: string, planName: string): Promise<boolean> => {
    const targetPlan = plans.find((p) => p.id === planId);
    if ((targetPlan?.currentUsers ?? 0) > 0) {
      showError(t('cannotDeleteActivePlan'));
      return false;
    }
    setDeleteTarget({ id: planId, name: planName });
    return true;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deletePlan(deleteTarget.id, deleteTarget.name);
      showSuccess(result.message);
      if (editingPlanId === deleteTarget.id) setDrawerOpen(false);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : tCommon('error');
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
    }
  };

  const handleToggleEnabled = async (plan: Plan) => {
    try {
      const result = await toggleEnabled(plan);
      showSuccess(result.message);
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : tCommon('error');
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
    }
  };

  const handleMakeUnlisted = async (plan: Plan) => {
    try {
      const result = await makeUnlisted(plan);
      showSuccess(result.message);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : tCommon('error'));
    }
  };

  const handleMakePublic = async (plan: Plan) => {
    try {
      const result = await makePublic(plan);
      showSuccess(result.message);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : tCommon('error'));
    }
  };

  const categoryObjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; planCount: number }>();
    for (const p of plans) {
      const cat = p.category;
      if (!cat) continue;
      const id = typeof cat === 'object' ? cat.id ?? '' : String(cat);
      const name = (typeof cat === 'object' && cat ? cat.name : null) ?? t('uncategorized');
      if (!id) continue;
      const existing = map.get(id);
      if (existing) existing.planCount += 1;
      else map.set(id, { id, name, planCount: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [plans, t]);

  const categories = useMemo(() => categoryObjects.map(c => c.name), [categoryObjects]);
  const activeFilterCount = (categoryFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);
  const clearFilters = () => { setCategoryFilter('all'); setStatusFilter('all'); };
  const removeFilter = (type: 'category' | 'status') => {
    if (type === 'category') setCategoryFilter('all');
    if (type === 'status') setStatusFilter('all');
  };

  const filteredPlans = useMemo(() => {
    let result = [...plans];
    if (categoryFilter !== 'all') {
      result = result.filter(p => {
        const catName = (typeof p.category === 'object' && p.category ? p.category.name : null) || (typeof p.category === 'string' ? p.category : null) || t('uncategorized');
        return catName === categoryFilter;
      });
    }
    if (statusFilter !== 'all') {
      result = result.filter(p => {
        if (statusFilter === 'public') return p.visibility === 'public' && p.enabled !== false;
        if (statusFilter === 'unlisted') return p.visibility === 'unlisted' && p.enabled !== false;
        if (statusFilter === 'disabled') return p.enabled === false;
        return true;
      });
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        (() => {
          const catName = (typeof p.category === 'object' && p.category ? p.category.name : null) || (typeof p.category === 'string' ? p.category : null) || '';
          return catName.toLowerCase().includes(lower);
        })()
      );
    }

    result.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'name_desc') return b.name.localeCompare(a.name);
      if (sort === 'price_desc') return (b.pricePerMonth || 0) - (a.pricePerMonth || 0);
      if (sort === 'price_asc') return (a.pricePerMonth || 0) - (b.pricePerMonth || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return result;
  }, [plans, searchQuery, categoryFilter, statusFilter, sort, t]);

  const startItem = totalItems === 0 ? 0 : (page - 1) * 10 + 1;
  const endItem = Math.min(page * 10, totalItems);

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<CreditCard strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={tCommon('errors.loadError')}
          title={t('errors.failedToLoadTitle')}
          errorString={error}
          description={<ErrorDescription error={error} topic={t('title')} />}
          buttons={
            <>
              <button
                onClick={() => loadPlans()}
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
    return <AdminStorePlansSkeleton />;
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
            <p className="mt-0.5 text-xs text-[#666]">{t('description')}</p>
          </div>
          <div className="flex items-center shrink-0">
            <button 
              onClick={() => { setEditingPlanId(null); setDrawerOpen(true); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
            >
              <Plus size={12} />
              {t('actions.createNew')}
            </button>
          </div>
        </div>

        <AdminPlansSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sort={sort}
          setSort={setSort}
          categories={categories}
          activeFilterCount={activeFilterCount}
          clearFilters={clearFilters}
        />
        
        <AdminPlanActiveFilters
          activeFilterCount={activeFilterCount}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          removeFilter={removeFilter}
          clearFilters={clearFilters}
        />

        <PlansList
          plans={filteredPlans}
          deleting={deleting}
          onDelete={handleDelete}
          onManage={(planId: string) => { setEditingPlanId(planId); setDrawerOpen(true); }}
          onToggleEnabled={handleToggleEnabled}
          onMakeUnlisted={handleMakeUnlisted}
          onMakePublic={handleMakePublic}
        />

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
            <p className="text-[11px] text-white/20">
              {tCommon('showing')} {startItem} - {endItem} {tCommon('of')} {totalItems}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage(Math.max(1, page - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={tCommon('previousPage')}
              >
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center px-2">
                <span className="text-xs font-medium text-white/40">
                  {page} <span className="text-white/20 mx-1">/</span> {totalPages}
                </span>
              </div>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={tCommon('nextPage')}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <PlanDrawer 
        planId={editingPlanId} 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSaveSuccess={() => { loadPlans(); }}
        onDeletePlan={handleDelete}
        preloadedCategories={categoryObjects}
      />

      <DeleteDrawer
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        entityType={t('planEntityType') || 'Plan'}
        entityName={deleteTarget?.name || ''}
        entitySubText={t('drawers.deleteBody', { planName: deleteTarget?.name || '' })}
        requireConfirmText={false}
      />
    </>
  );
}
