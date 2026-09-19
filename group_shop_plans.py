filepath = 'frontend/src/components/shop/PlansView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Grouping logic for PlansView Available Plans
import_code = """  const groupedAvailablePlans = plans.reduce((acc, plan) => {
    const categoryName = plan.category?.name || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(plan);
    return acc;
  }, {} as Record<string, any[]>);
  
  const availableCategories = Object.keys(groupedAvailablePlans).sort();
"""

content = content.replace("  const groupedPlans = Object.values(groups);", "  const groupedPlans = Object.values(groups);\n\n" + import_code)

old_render = """          <div className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {plans.map((plan) => (
              <PlanRow
                key={plan._id || plan.id}
                plan={plan}
                currency={currency}
                onPurchase={() => onPurchasePlan(plan)}
              />
            ))}
          </div>"""

new_render = """          <div className="mt-6 space-y-10 border-t border-white/[0.06] pt-6">
            {availableCategories.map((category) => (
              <div key={category} className="w-full">
                <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
                  {category}
                </h2>
                <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-[#121212]">
                  {groupedAvailablePlans[category].map((plan: any) => (
                    <PlanRow
                      key={plan._id || plan.id}
                      plan={plan}
                      currency={currency}
                      onPurchase={() => onPurchasePlan(plan)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {plans.length === 0 && <div className="py-8 text-center text-xs text-[#666]">No available plans found.</div>}
          </div>"""

content = content.replace(old_render, new_render)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Shop PlansView!")
