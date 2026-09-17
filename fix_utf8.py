import os

sort_files = [
    'frontend/src/components/admin/gifts/AdminGiftSort.tsx',
    'frontend/src/components/admin/logs/AdminLogsSort.tsx',
    'frontend/src/components/admin/servers/AdminServerSort.tsx',
    'frontend/src/components/admin/tickets/AdminTicketSort.tsx',
    'frontend/src/components/tickets/TicketSort.tsx'
]

for filepath in sort_files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    content = content.replace('', '-')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
