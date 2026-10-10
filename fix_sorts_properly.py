import os
import re

sort_files = [
    'frontend/src/components/admin/gifts/AdminGiftSort.tsx',
    'frontend/src/components/admin/logs/AdminLogsSort.tsx',
    'frontend/src/components/admin/servers/AdminServerSort.tsx',
    'frontend/src/components/admin/tickets/AdminTicketSort.tsx',
    'frontend/src/components/tickets/TicketSort.tsx'
]

def replace_sort_file(filepath):
    if not os.path.exists(filepath):
        print("Missing:", filepath)
        return

    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # Clean up weird characters BEFORE parsing
    content = content.replace('\ufffd', '-')
    content = content.replace('   ', ' to ')

    options_match = re.search(r'\[\s*(\{.*?label.*?value.*?\}[\s,]*)+\]', content, re.DOTALL)
    if not options_match:
        print("No options:", filepath)
        return
        
    options_array = options_match.group(0)

    props_match = re.search(r'export function (\w+)\(\{\s*(\w+),\s*(\w+)\s*\}\s*:\s*\w+\)', content)
    if not props_match:
        print("No props:", filepath)
        return
    component_name = props_match.group(1)
    val_prop = props_match.group(2)
    set_prop = props_match.group(3)

    new_content = """'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface %sProps {
  %s: string;
  %s: (val: string) => void;
}

export function %s({ %s, %s }: %sProps) {
  return (
    <div className="w-[180px]">
      <Select
        value={%s}
        onChange={%s}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">Sort</span>
          </div>
        )}
        options={%s}
      />
    </div>
  );
}
""" % (component_name, val_prop, set_prop, component_name, val_prop, set_prop, component_name, val_prop, set_prop, options_array)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed:", filepath)

for filepath in sort_files:
    replace_sort_file(filepath)

