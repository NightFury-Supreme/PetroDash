filepath = 'frontend/src/components/admin/plan/PlansList.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

grouping_logic = """  // Group plans by category
  const groupedPlans = plans.reduce((acc, plan) => {
    const categoryName = (plan.category as any)?.name || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(plan);
    return acc;
  }, {} as Record<string, Plan[]>);

  const categories = Object.keys(groupedPlans).sort();

  return (
    <div className="w-full space-y-10 border-t border-white/[0.06] pt-6">
      {categories.map((category) => (
        <div key={category} className="w-full">
          <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
            {category}
          </h2>
          <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-[#121212]">
            {groupedPlans[category].map((plan) => (
              <AdminPlanRow
                key={plan._id}
                plan={plan}
                currency={currency}
                onManage={() => onManage?.(plan._id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}"""

# Replace the old return statement
content = content.replace("""  return (
    <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
      {plans.map((plan) => (
        <AdminPlanRow
          key={plan._id}
          plan={plan}
          currency={currency}
          onManage={() => onManage?.(plan._id)}
        />
      ))}
    </div>
  );
}""", grouping_logic)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PlansList")
