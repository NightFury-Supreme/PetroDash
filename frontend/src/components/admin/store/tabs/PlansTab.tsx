"use client";

import { useState } from 'react';
import { CreditCard, RefreshCw, Plus, Search } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { useToast } from "@/components/ui/ToastProvider";
import { useModal } from '@/components/Modal';
import { PlansListSkeleton } from '@/components/skeletons/admin/plan/list/PlansListSkeleton';
import { usePlansList } from '@/hooks/admin/plan/usePlansList';
import { PlansList } from '@/components/admin/plan/PlansList';
import { PlanDrawer } from '@/components/admin/plan/PlanDrawer';
import { AdminPlanFilters } from '@/components/admin/plan/AdminPlanFilters';
import { AdminPlanActiveFilters } from '@/components/admin/plan/AdminPlanActiveFilters';
import { Pagination } from '@/components/Pagination';
import { useMemo } from 'react';


export default function AdminPlansTab() {
  const modal = useModal();
  const { showSuccess, showError } = useToast();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");


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

  const handleDelete = async (planId: string, planName: string) => {
    const confirmed = await modal.confirm({
      title: 'Delete Plan',
      body: `Are you sure you want to delete "${planName}"? This action cannot be undone.`,
      confirmText: 'Delete'
    });

    if (!confirmed) return;

    try {
      const result = await deletePlan(planId, planName);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleToggleEnabled = async (plan: any) => {
    try {
      const result = await toggleEnabled(plan);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMakeUnlisted = async (plan: any) => {
    try {
      const result = await makeUnlisted(plan);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMakePublic = async (plan: any) => {
    try {
      const result = await makePublic(plan);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };


  /** Structured category list derived from loaded plans - used both for filtering and to
   *  pre-populate PlanCategorySelect in the edit drawer, eliminating a separate /categories fetch. */
  const categoryObjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; planCount: number }>();
    for (const p of plans) {
      const cat = p.category as any;
      if (!cat) continue;
      const id   = cat._id ?? cat.id ?? '';
      const name = cat.name ?? 'Uncategorized';
      if (!id) continue;
      if (map.has(id)) {
        map.get(id)!.planCount += 1;
      } else {
        map.set(id, { id, name, planCount: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [plans]);

  const categories = useMemo(() => categoryObjects.map(c => c.name), [categoryObjects]);

  const activeFilterCount = categoryFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setCategoryFilter('all');
  const removeFilter = () => setCategoryFilter('all');

  const filteredPlans = useMemo(() => {
    let result = plans;
    if (categoryFilter !== 'all') {
      result = result.filter(p => (p.category || 'Uncategorized') === categoryFilter);
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        (p.category && p.category.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [plans, searchQuery, categoryFilter]);

  if (error) {

    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<CreditCard strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Plans"
          errorString={error}
          description={<ErrorDescription error={error} topic="Plans" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <>
        <PlansListSkeleton />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
          {/* Header & Action Bar */}
          <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Plans</h2>
              <p className="mt-0.5 text-xs text-[#666]">Manage subscription plans, adjust pricing, and toggle availability.</p>
            </div>
            <div className="flex items-center shrink-0">
              <button 
                onClick={() => { setEditingPlanId(null); setDrawerOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
                >
                <Plus size={12} />
                Create New Plan
              </button>
            </div>
          </div>


          <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by plan name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
              />
            </div>
            <div className="flex items-center gap-[7px] w-full sm:w-auto">
              <AdminPlanFilters
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories as string[]}
                activeFilterCount={activeFilterCount}
                clearFilters={clearFilters}
              />
            </div>
          </div>
          
          <AdminPlanActiveFilters
            activeFilterCount={activeFilterCount}
            categoryFilter={categoryFilter}
            removeFilter={removeFilter}
            clearFilters={clearFilters}
          />

          {/* Plans List */}
          <PlansList
            plans={filteredPlans}
            deleting={deleting}
            onDelete={handleDelete}
            onManage={(planId: string) => { setEditingPlanId(planId); setDrawerOpen(true); }}
            onToggleEnabled={handleToggleEnabled}
            onMakeUnlisted={handleMakeUnlisted}
            onMakePublic={handleMakePublic}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={10}
            onPageChange={setPage}
            itemName="plans"
          />

        </div>
        
        <PlanDrawer 
          planId={editingPlanId} 
          isOpen={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          onSaveSuccess={() => { loadPlans(); }}
          onDeletePlan={handleDelete}
          preloadedCategories={categoryObjects}
        />
    </>
  );
}
