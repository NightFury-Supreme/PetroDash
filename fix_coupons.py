filepath = 'frontend/src/components/admin/coupons/CouponsHeader.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-white hover:bg-gray-100 text-black px-4 py-2 text-sm rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm', 'bg-[#FF5722] hover:bg-[#ff6939] text-white h-[42px] px-4 text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
