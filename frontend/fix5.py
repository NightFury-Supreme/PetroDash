import re

with open('src/components/admin/locations/EditLocationDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Change header
c = re.sub(r'<div><h3[^>]*>Permissions</h3>.*?</div>',
           '<div><h3 className="text-sm font-medium text-white mb-1">Allowed Plans</h3><p className="text-xs text-[#888] mb-4">Select which plans are permitted to deploy in this location. Leave empty to allow all plans.</p></div>',
           c)

# Change wrapper
c = c.replace('className="divide-y divide-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden"',
              'className="border-t border-white/[0.06] divide-y divide-white/[0.06]"')

with open('src/components/admin/locations/EditLocationDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done Edit')
