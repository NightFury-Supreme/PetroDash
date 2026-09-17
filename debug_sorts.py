import os
import re

filepath = 'frontend/src/components/admin/servers/AdminServerSort.tsx'
with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

props_match = re.search(r'export function (\w+)\(\{\s*(\w+),\s*(\w+)\s*\}\s*:\s*\w+\)', content)
if not props_match:
    print("PROPS NOT MATCHED")
else:
    print("PROPS MATCHED")
