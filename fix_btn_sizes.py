filepath = 'frontend/src/components/admin/plan/PlanDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add min-w-[140px] to Create Plan ActionButton
content = content.replace('label="Create Plan"', 'className="min-w-[140px]"\n                label="Create Plan"')

# Add min-w-[140px] to Save Changes ActionButton
content = content.replace('label="Save Changes"', 'className="min-w-[140px]"\n                label="Save Changes"')

# Add min-w-[140px] to Enable Item ActionButton
content = content.replace('label="Enable Item"', 'className="min-w-[140px]"\n                label="Enable Item"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
