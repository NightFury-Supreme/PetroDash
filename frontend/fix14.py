import re

filepath = 'src/components/admin/locations/CreateLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove error state
c = re.sub(r'const \[error,\s*setError\]\s*=\s*useState<string \| null>\(null\);\n?', '', c)

# Remove setError calls
c = re.sub(r'setError\(.*?\);\n?', '', c)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
