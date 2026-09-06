import re

filepath = 'frontend/src/components/admin/locations/CreateLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Update label to include asterisk
c = c.replace('<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Node IP</label>',
              '<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Node IP <span className="text-[#FF5722]">*</span></label>')

# Add required to input
c = c.replace('placeholder="e.g. 192.168.1.1 or node.example.com" />',
              'placeholder="e.g. 192.168.1.1 or node.example.com" required />')

# Update canGoNext
old_cgn = """  const canGoNext = () => {
    if (currentStep === 'basic') return form.name.trim().length > 0 && (form.flag || pendingFlagFile);
    return true;
  };"""
new_cgn = """  const canGoNext = () => {
    if (currentStep === 'basic') return form.name.trim().length > 0 && form.latencyUrl.trim().length > 0 && (form.flag || pendingFlagFile);
    return true;
  };"""
c = c.replace(old_cgn, new_cgn)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done Create')
