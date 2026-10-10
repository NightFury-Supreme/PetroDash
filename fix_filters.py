import os

filepath = 'frontend/src/components/admin/servers/AdminServerFilters.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_return = """  return (
    <div className="w-[180px]">
      <Select
        value=""
        dropdownClassName="w-[350px] right-0 max-w-[calc(100vw-36px)] sm:max-w-none"
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <SlidersHorizontal size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">Filters</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[17px] h-[17px] inline-flex items-center justify-center px-1 rounded-[9px] bg-[#ff5722] text-white text-[8px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
        )}
        renderDropdown={({ close }) => (
          <div className="flex flex-col">
            <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
              <strong className="text-[#ddd] text-[11px] mb-[2px]">Filters</strong>
              <span className="text-[#555] text-[9px]">Narrow down your servers</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] p-[13px]">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Node</label>
                <Select size="sm"
                  value={locationFilter}
                  options={[
                    { label: "All Nodes", value: "all" },
                    ...locations.map(loc => ({ label: loc.name, value: loc._id }))
                  ]}
                  onChange={setLocationFilter}
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Egg</label>
                <Select size="sm"
                  value={eggFilter}
                  options={[
                    { label: "All Eggs", value: "all" },
                    ...eggs.map(egg => ({ label: egg.name, value: egg._id }))
                  ]}
                  onChange={setEggFilter}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-[15px] px-3 py-3 border-t border-[#222]">
              <button 
                onClick={clearFilters} 
                className="text-[10px] font-medium text-[#777] hover:text-[#ddd] transition-colors"
              >
                Clear filters
              </button>
              <button 
                onClick={close} 
                className="h-[35px] px-[15px] rounded-md text-[10px] font-semibold bg-[#ff5722] text-white hover:bg-[#ff6939] transition-colors"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
"""

content = content.split('  return (')[0] + new_return
content = content.replace('import React, { useState, useRef, useEffect } from \'react\';', 'import React from \'react\';')
content = content.replace('  const [filtersOpen, setFiltersOpen] = useState(false);\n  const filterRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    const handler = (e: MouseEvent) => {\n      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFiltersOpen(false);\n    };\n    document.addEventListener("mousedown", handler);\n    return () => document.removeEventListener("mousedown", handler);\n  }, []);\n\n', '')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

