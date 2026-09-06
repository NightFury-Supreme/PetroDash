import re
files = [
    'src/components/admin/locations/CreateLocationDrawer.tsx',
    'src/components/admin/locations/EditLocationDrawer.tsx',
    'src/app/admin/locations/page.tsx',
    'src/components/admin/locations/LocationList.tsx',
]
for p in files:
    try:
        with open(p, 'r', encoding='utf-8') as f:
            c = f.read()
            c = c.replace("process.env.NEXT_PUBLIC_API_BASE || '}/", "process.env.NEXT_PUBLIC_API_BASE || ''}/")
            c = c.replace("process.env.NEXT_PUBLIC_API_BASE || '}", "process.env.NEXT_PUBLIC_API_BASE || ''}")
            c = c.replace("`Bearer `", "`Bearer ${token}`")
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)
        print("Fixed " + p)
    except Exception as e:
        print("Error in " + p, e)
