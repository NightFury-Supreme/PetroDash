"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from "@/i18n/routing";
import EggsHeader from '@/components/admin/eggs/EggsHeader';
import EggList from '@/components/admin/eggs/EggList';
import AdminEggsSkeleton from '@/components/skeletons/admin/eggs/AdminEggsSkeleton';
import { Search, X, Egg, Box, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { AdminEggFilters } from '@/components/admin/eggs/AdminEggFilters';
import { AdminEggActiveFilters } from '@/components/admin/eggs/AdminEggActiveFilters';
import { CreateEggDrawer } from '@/components/admin/eggs/CreateEggDrawer';
import { EditEggDrawer } from '@/components/admin/eggs/EditEggDrawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';

export default function EggsListPage() {
  const router = useRouter();
  const [eggs, setEggs] = useState<Array<{ _id: string; name: string; description: string; pterodactylEggId: string; pterodactylNestId: string; recommended: boolean; allowedPlans: string[], category?: string, serversCount?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEggId, setEditingEggId] = useState<string | null>(null);
  const [deletingEggId, setDeletingEggId] = useState<string | null>(null);

  const fetchEggs = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.replace('/login'); return; }
    
    setLoading(true);
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/eggs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to fetch eggs');
        if (Array.isArray(data)) setEggs(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEggs();
  }, [fetchEggs]);

  const categoryObjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; eggCount: number }>();
    for (const e of eggs) {
      const id = (e as any).category;
      const name = (e as any).categoryName || 'Uncategorized';
      if (!id) continue;
      if (map.has(id)) {
        map.get(id)!.eggCount += 1;
      } else {
        map.set(id, { id, name, eggCount: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [eggs]);

  const categories = useMemo(() => categoryObjects.map(c => c.name), [categoryObjects]);

  const activeFilterCount = categoryFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setCategoryFilter('all');
  const removeFilter = () => setCategoryFilter('all');

  const filteredEggs = useMemo(() => {
    let result = eggs;
    if (categoryFilter !== 'all') {
      result = result.filter(e => {
        const cat = (e as any).categoryName || 'Uncategorized';
        return cat === categoryFilter;
      });
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((e) => 
        e.name.toLowerCase().includes(lower) || 
        ((e as any).categoryName && (e as any).categoryName.toLowerCase().includes(lower)) ||
        e.pterodactylEggId.toString().includes(lower) ||
        e.pterodactylNestId.toString().includes(lower)
      );
    }
    return result;
  }, [eggs, searchQuery, categoryFilter]);

  const handleExecuteDelete = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      let d: any = {}; try { d = await res.json(); } catch {}
      throw new Error(d?.error || 'Failed to delete egg');
    }
    fetchEggs();
  };

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Box strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Eggs"
          errorString={error}
          description={<ErrorDescription error={error} topic="Eggs" />}
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

  if (loading) {
    return <AdminEggsSkeleton />;
  }

  const eggToDelete = eggs.find(e => e._id === deletingEggId);

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
                placeholder="Search by egg name, category, or nest ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
                  aria-label="Clear search"
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

        <EggList eggs={filteredEggs} onEdit={(id) => setEditingEggId(id)} onDelete={(id) => setDeletingEggId(id)} />
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
        isOpen={!!deletingEggId}
        onClose={() => setDeletingEggId(null)}
        onConfirm={async () => {
          if (deletingEggId) await handleExecuteDelete(deletingEggId);
        }}
        entityType="Egg"
        entityName={eggToDelete?.name || ''}
        entitySubText={eggToDelete ? `Nest ID: ${eggToDelete.pterodactylNestId} Egg ID: ${eggToDelete.pterodactylEggId}` : ''}
        icon={
          (eggToDelete as any)?.icon ? (
            <img src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${(eggToDelete as any).icon}`} className="w-10 h-10 object-contain rounded" />
          ) : <Egg size={24} />
        }
        warningPoints={[
          "Egg configuration will be permanently deleted.",
          "Any new servers will not be able to use this egg.",
          "This action cannot be undone."
        ]}
      />
    </div>
  );
}


