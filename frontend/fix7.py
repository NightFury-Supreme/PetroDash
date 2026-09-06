import re

with open('src/components/admin/locations/EditLocationDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_cancel = '<button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-[#222] bg-transparent px-4 py-2.5 text-sm font-medium text-[#D4D4D4] transition-colors hover:bg-[#161616] disabled:opacity-50">Cancel</button>'
new_cancel = '<button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-medium text-[#888] hover:text-white transition-colors disabled:opacity-50">Cancel</button>'

c = c.replace(old_cancel, new_cancel)

old_save = '<button type="submit" form="location-form" disabled={submitting} className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50">'
new_save = '<button type="submit" form="location-form" disabled={submitting} className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed">'

c = c.replace(old_save, new_save)

with open('src/components/admin/locations/EditLocationDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done Edit')
