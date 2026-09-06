import re

filepath = 'backend/src/routes/admin/locations.js'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("latencyUrl: z.string().optional().or(z.literal('')),", "latencyUrl: z.string().min(1, 'Node IP is required'),")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done backend')
