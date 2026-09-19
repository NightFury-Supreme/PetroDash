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
        return

    with open(filepath, 'rb') as f:
        content_bytes = f.read()
        content = content_bytes.decode('utf-8')

    options_match = re.search(r'\[\s*(\{.*?label.*?value.*?\}[\s,]*)+\]', content, re.DOTALL)
    if not options_match:
        return
        
    options_array = options_match.group(0)

    props_match = re.search(r'export function (\w+)\(\{\s*(\w+),\s*(\w+)\s*\}\s*:\s*\w+\)', content)
    if not props_match:
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

    with open(filepath, 'wb') as f:
        f.write(new_content.encode('utf-8'))

for filepath in sort_files:
    replace_sort_file(filepath)

