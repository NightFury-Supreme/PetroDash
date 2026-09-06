import re

filepath = 'src/components/admin/locations/EditLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove unused drag handlers
c = re.sub(r'const handleDragOver.*?};\n?', '', c, flags=re.DOTALL)
c = re.sub(r'const handleDragLeave.*?};\n?', '', c, flags=re.DOTALL)
c = re.sub(r'const handleDrop.*?};\n?', '', c, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
