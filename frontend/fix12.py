import re

filepath = 'src/components/admin/locations/CreateLocationDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove unused states
c = re.sub(r'const \[failed,\s*setFailed\]\s*=\s*useState\(false\);\n?', '', c)
c = re.sub(r'const \[saved,\s*setSaved\]\s*=\s*useState\(false\);\n?', '', c)

# Remove unused drag handlers
c = re.sub(r'const handleDragOver.*?};\n?', '', c, flags=re.DOTALL)
c = re.sub(r'const handleDragLeave.*?};\n?', '', c, flags=re.DOTALL)
c = re.sub(r'const handleDrop.*?};\n?', '', c, flags=re.DOTALL)

# Remove unused isLastStep
c = re.sub(r'const isLastStep.*?;', '', c)

# And now wait! In the footer, `failed` and `saved` are used!
# I need to replace the footer again to remove `failed` and `saved` logic if I just deleted them!
# Wait, let's just make the Create Location button exactly like the simple Next button!
old_create_button_pattern = r'\{currentStepIndex < STEPS\.length - 1 \? \((.*?)\) : \(\s*<button[^>]*>[\s\S]*?</button>\s*\)\}'

new_button = """{currentStepIndex < STEPS.length - 1 ? (\\1) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploadingFlag}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || uploadingFlag) ? <><Loader2 size={15} className="animate-spin shrink-0" /> Creating...</> : <><Globe size={15} /> Create Location</>}
              </button>
            )}"""

c = re.sub(old_create_button_pattern, new_button, c, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
