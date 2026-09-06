import re

filepath = 'frontend/src/components/admin/locations/EditLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove required attributes
c = c.replace('placeholder="e.g. US East" required />', 'placeholder="e.g. US East" />')
c = c.replace('placeholder="e.g. 192.168.1.1 or node.example.com" required />', 'placeholder="e.g. 192.168.1.1 or node.example.com" />')

# Add form.name validation
old_save = """  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!pendingFlagFile && (!form.flag || form.flag === 'pending')) {"""
new_save = """  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name || form.name.trim().length === 0) {
      alert("Location name is required.");
      return;
    }
    if (!pendingFlagFile && (!form.flag || form.flag === 'pending')) {"""
c = c.replace(old_save, new_save)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
