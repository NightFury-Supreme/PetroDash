filepath = 'frontend/src/components/shop/PlansView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The unused vars block:
unwanted_block = """  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(plans.map((p: any) => p.category?.name || 'Uncategorized'));
    return Array.from(cats).sort();
  }, [plans]);

  const filteredPlans = useMemo(() => {
    if (activeCategory === "all") return plans;
    return plans.filter((p: any) => (p.category?.name || 'Uncategorized') === activeCategory);
  }, [plans, activeCategory]);"""

content = content.replace(unwanted_block, "")

# The import `useState, useMemo` isn't strictly needed if no other hooks are used, but we'll leave it or replace it if needed.
# Let's also check if I accidentally left the old description string referencing filteredPlans.length
content = content.replace("description={`${filteredPlans.length}", "description={`${plans.length}")
content = content.replace("filteredPlans.length === 1", "plans.length === 1")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed unused vars")
