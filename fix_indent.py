filepath = 'frontend/src/app/admin/store/plans/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
    
content = content.replace('            <div className="flex items-center shrink-0">\n                <button ', '            <div className="flex items-center shrink-0">\n              <button ')
content = content.replace('                  onClick={() => { setEditingPlanId(null); setDrawerOpen(true); }}', '                onClick={() => { setEditingPlanId(null); setDrawerOpen(true); }}')
content = content.replace('                  className="bg-[#FF5722] hover:bg-[#ff6939] text-white h-[42px] px-4 text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"', '                className="bg-[#FF5722] hover:bg-[#ff6939] text-white h-[42px] px-4 text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"')
content = content.replace('                  <Plus size={16} />', '                <Plus size={16} />')
content = content.replace('                  Create New Plan', '                Create New Plan')
content = content.replace('                </button>\n            </div>', '              </button>\n            </div>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
