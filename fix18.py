import re

filepath = 'frontend/src/components/admin/locations/EditLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

old_save = """  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    try {"""
new_save = """  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!pendingFlagFile && (!form.flag || form.flag === 'pending')) {
      alert("Location flag is required.");
      return;
    }
    setSubmitting(true);
    try {"""
c = c.replace(old_save, new_save)

c = c.replace('<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Flag / Icon</label>',
              '<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Flag / Icon <span className="text-[#FF5722]">*</span></label>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)
print('Done Edit')
