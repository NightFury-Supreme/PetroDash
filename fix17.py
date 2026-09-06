import re

filepath = 'frontend/src/components/admin/locations/CreateLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Make flag required in canGoNext
old_cgn = """  const canGoNext = () => {
    if (currentStep === 'basic') return form.name.trim().length > 0;
    return true;
  };"""
new_cgn = """  const canGoNext = () => {
    if (currentStep === 'basic') return form.name.trim().length > 0 && (form.flag || pendingFlagFile);
    return true;
  };"""
c = c.replace(old_cgn, new_cgn)

# Update handleSubmit with alert
old_submit = """  const handleSubmit = async () => {
    setLoading(true);
    try {"""
new_submit = """  const handleSubmit = async () => {
    if (!pendingFlagFile && !form.flag) {
      alert("Location flag is required.");
      return;
    }
    setLoading(true);
    try {"""
c = c.replace(old_submit, new_submit)

# Add asterisk to label
c = c.replace('<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Location Flag / Icon</label>',
              '<label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Location Flag / Icon <span className="text-[#FF5722]">*</span></label>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)
print('Done Create')
