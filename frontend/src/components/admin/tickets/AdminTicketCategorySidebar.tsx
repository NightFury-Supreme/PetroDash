'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { NavItem } from './AdminTicketNavSidebar';

export function AdminTicketCategorySidebar({
  activeCategory,
  onCategoryChange,
  categories,
  catCounts,
}: {
  activeCategory: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
  catCounts: Record<string, number>;
}) {
  if (categories.length === 0) return null;

  return (
    <aside className="w-full lg:w-48 shrink-0 pt-1">
      <div className="sticky top-6">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#555]">Categories</p>
        <nav className="space-y-0.5 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
          <NavItem icon={Tag} label="All Categories" count={null} active={activeCategory === ''} onClick={() => onCategoryChange('')} />
          {categories.map(c => (
            <NavItem key={c} icon={Tag} label={c} count={catCounts[c] || 0} active={activeCategory === c} onClick={() => onCategoryChange(c)} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
