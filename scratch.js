
const fs = require('fs');
let file = fs.readFileSync('frontend/src/components/admin/settings/AdminSettingsContent.tsx', 'utf8');

file = file.replace(/className="space-y-2 list-decimal list-inside text-xs text-\\[#888\\]"/g, 'className="list-decimal list-inside text-xs text-[#888] divide-y divide-white/[0.06]"');
file = file.replace(/className="space-y-2 text-xs text-\\[#888\\]"/g, 'className="list-disc list-inside text-xs text-[#888] divide-y divide-white/[0.06]"');

file = file.replace(/<li>/g, '<li className="py-2.5 pl-1">');

fs.writeFileSync('frontend/src/components/admin/settings/AdminSettingsContent.tsx', file);

