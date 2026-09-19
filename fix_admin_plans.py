filepath = 'frontend/src/app/admin/store/plans/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import_lucide = "import { CreditCard, RefreshCw, Plus, Search } from 'lucide-react';"
content = content.replace("import { CreditCard, RefreshCw, Plus } from 'lucide-react';", import_lucide)

import_filters = """import { AdminPlanFilters } from '@/components/admin/plan/AdminPlanFilters';
import { AdminPlanActiveFilters } from '@/components/admin/plan/AdminPlanActiveFilters';
import { useMemo } from 'react';
"""
content = content.replace("import { PlanDrawer } from '@/components/admin/plan/PlanDrawer';", "import { PlanDrawer } from '@/components/admin/plan/PlanDrawer';\n" + import_filters)

state_hooks = """  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
"""
content = content.replace("  const [drawerOpen, setDrawerOpen] = useState(false);\n  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);", state_hooks)

compute_filtered = """
  const categories = useMemo(() => {
    const cats = new Set(plans.map(p => p.category?.name || 'Uncategorized'));
    return Array.from(cats).sort();
  }, [plans]);

  const activeFilterCount = categoryFilter !== 'all' ? 1 : 0;
  const clearFilters = () => setCategoryFilter('all');
  const removeFilter = () => setCategoryFilter('all');

  const filteredPlans = useMemo(() => {
    let result = plans;
    if (categoryFilter !== 'all') {
      result = result.filter(p => (p.category?.name || 'Uncategorized') === categoryFilter);
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        (p.category?.name && p.category.name.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [plans, searchQuery, categoryFilter]);

  if (error) {
"""
content = content.replace("  if (error) {", compute_filtered)

search_ui = """
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
"""
content = content.replace("          {/* Plans List */}\n          <PlansList\n            plans={plans}", search_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin plans page")
