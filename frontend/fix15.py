import re

filepath = 'src/components/admin/locations/CreateLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('catch (e: any) {', 'catch (e: any) {\n        console.error(e);')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)
