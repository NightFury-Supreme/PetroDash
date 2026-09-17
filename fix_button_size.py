filepath_plans = 'frontend/src/app/admin/store/plans/page.tsx'
with open(filepath_plans, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('className="bg-[#FF5722] hover:bg-[#ff6939] text-white h-[42px] px-4 text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"', 'className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"')
content = content.replace('<Plus size={16} />', '<Plus size={12} />')

with open(filepath_plans, 'w', encoding='utf-8') as f:
    f.write(content)

filepath_coupons = 'frontend/src/components/admin/coupons/CouponsHeader.tsx'
with open(filepath_coupons, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('className="bg-[#FF5722] hover:bg-[#ff6939] text-white h-[42px] px-4 text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"', 'className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"')

with open(filepath_coupons, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
