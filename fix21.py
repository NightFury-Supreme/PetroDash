import re

filepath = 'frontend/src/components/admin/locations/EditLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Update label to include asterisk
c = c.replace('<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Node IP</label>',
              '<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Node IP <span className="text-[#FF5722]">*</span></label>')

# Add required to input
c = c.replace('placeholder="e.g. 192.168.1.1 or node.example.com" />',
              'placeholder="e.g. 192.168.1.1 or node.example.com" required />')

# Update save function with alert
old_save = """  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!pendingFlagFile && (!form.flag || form.flag === 'pending')) {
      alert("Location flag is required.");
      return;
    }
    setSubmitting(true);
    try {"""
new_save = """  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!pendingFlagFile && (!form.flag || form.flag === 'pending')) {
      alert("Location flag is required.");
      return;
    }
    if (!form.latencyUrl || form.latencyUrl.trim().length === 0) {
      alert("Node IP is required.");
      return;
    }
    setSubmitting(true);
    try {"""
c = c.replace(old_save, new_save)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done Edit')
