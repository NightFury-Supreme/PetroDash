filepath = 'frontend/src/components/shop/PlansView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import_react = 'import React, { useState, useMemo } from "react";'
content = content.replace('import React from "react";', import_react)

state_hooks = """export function PlansView({
  plans,
  activePlans,
  currency,
  onPurchasePlan,
}: PlansViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(plans.map((p: any) => p.category?.name || 'Uncategorized'));
    return Array.from(cats).sort();
  }, [plans]);

  const filteredPlans = useMemo(() => {
    if (activeCategory === "all") return plans;
    return plans.filter((p: any) => (p.category?.name || 'Uncategorized') === activeCategory);
  }, [plans, activeCategory]);

  // Group active plans"""
content = content.replace("""export function PlansView({
  plans,
  activePlans,
  currency,
  onPurchasePlan,
}: PlansViewProps) {

  // Group active plans""", state_hooks)

tabs_ui = """        {/* ================================================================
           AVAILABLE PLANS
        ================================================================= */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-4">
            <SectionTitle
              icon={<Crown className="h-3.5 w-3.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />}
              title="Available Plans"
              description={`${filteredPlans.length} ${
                filteredPlans.length === 1 ? "plan" : "plans"
              } available.`}
            />
          </div>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/[0.06] pb-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === "all"
                    ? "bg-[#FF5722] text-white"
                    : "bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                All
              </button>
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-[#FF5722] text-white"
                      : "bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212] divide-y divide-white/[0.06]">
            {filteredPlans.map((plan: any) => (
              <PlanRow
                key={plan._id}
                plan={plan}
"""
content = content.replace("""        {/* ================================================================
           AVAILABLE PLANS
        ================================================================= */}
        <section className="mt-8">
          <SectionTitle
            icon={<Crown className="h-3.5 w-3.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />}
            title="Available Plans"
            description={`${plans.length} ${
              plans.length === 1 ? "plan" : "plans"
            } available.`}
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212] divide-y divide-white/[0.06]">
            {plans.map((plan: any) => (
              <PlanRow
                key={plan._id}
                plan={plan}""", tabs_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PlansView.tsx")
