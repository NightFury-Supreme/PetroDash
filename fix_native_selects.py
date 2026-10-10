import os
import re

files = [
    'frontend/src/components/admin/gifts/drawers/AdminEditGiftDrawer.tsx',
    'frontend/src/components/admin/gifts/drawers/AdminCreateGiftDrawer.tsx',
    'frontend/src/components/admin/coupons/NewCouponPageContent.tsx',
    'frontend/src/components/admin/coupons/EditCouponPageContent.tsx'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'import { Select } from "@/components/ui/Select";' not in content:
        content = content.replace('import { useState', 'import { Select } from "@/components/ui/Select";\nimport { useState', 1)
        if 'import { Select }' not in content:
            content = "import { Select } from \"@/components/ui/Select\";\n" + content

    if 'AdminEditGiftDrawer.tsx' in filepath or 'AdminCreateGiftDrawer.tsx' in filepath:
        content = re.sub(
            r'<select value=\{form\.enabled \? "true" : "false"\} onChange=\{\(e\) => setForm\(\{ \.\.\.form, enabled: e\.target\.value === "true" \}\)\} disabled=\{saving\} className="w-full bg-\[\#1A1A1A\] border border-\[\#2A2A2A\] rounded-lg px-4 py-2\.5 text-sm text-white focus:outline-none focus:border-\[\#FF5722\]/50 appearance-none">\s*<option value="true">Yes</option>\s*<option value="false">No</option>\s*</select>',
            r'<Select value={form.enabled ? "true" : "false"} onChange={(val) => setForm({ ...form, enabled: val === "true" })} disabled={saving} options={[{label: "Yes", value: "true"}, {label: "No", value: "false"}]} size="md" />',
            content
        )
    else:
        content = re.sub(
            r'<select className="input" value=\{form\.type\} onChange=\{\(e\) => setForm\(\{ \.\.\.form, type: e\.target\.value \}\)\}>\s*<option value="percentage">Percentage \(\%\)</option>\s*<option value="fixed">Fixed amount \(\{currency\}\)</option>\s*</select>',
            r'<Select value={form.type} onChange={(val) => setForm({ ...form, type: val })} options={[{label: "Percentage (%)", value: "percentage"}, {label: `Fixed amount (${currency})`, value: "fixed"}]} size="md" />',
            content
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

