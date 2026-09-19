filepath = 'frontend/src/components/admin/plan/PlansList.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the box wrapper with a simple divide-y and border-t
content = content.replace(
    'className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-[#121212]"',
    'className="divide-y divide-white/[0.06] border-t border-white/[0.06]"'
)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

filepath = 'frontend/src/components/shop/PlansView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-[#121212]"',
    'className="divide-y divide-white/[0.06] border-t border-white/[0.06]"'
)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed box wrappers")
