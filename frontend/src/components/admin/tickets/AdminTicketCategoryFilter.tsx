import React from "react";

interface AdminTicketCategoryFilterProps {
  categories: string[];
  activeTab: string;
  catFilter: string;
  tickets: Array<{ category?: string; status: string; deletedByUser?: boolean }>;
  onSelect: (cat: string) => void;
}

export function AdminTicketCategoryFilter({
  categories,
  activeTab,
  catFilter,
  tickets,
  onSelect,
}: AdminTicketCategoryFilterProps) {
  if (categories.length === 0) return null;

  const catCounts = categories.reduce((acc, cat) => {
    acc[cat] = tickets.filter((t) => {
      if (activeTab === "deleted") return !!t.deletedByUser && t.category === cat;
      if (t.deletedByUser) return false;
      if (activeTab === "all") return t.status !== "closed" && t.category === cat;
      return t.status === activeTab && t.category === cat;
    }).length;
    return acc;
  }, {} as Record<string, number>);

  const allCategoriesCount = tickets.filter((t) => {
    if (activeTab === "deleted") return !!t.deletedByUser;
    if (t.deletedByUser) return false;
    if (activeTab === "all") return t.status !== "closed";
    return t.status === activeTab;
  }).length;

  return (
    <div className="mb-6 -ml-[13px] flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <button
        onClick={() => onSelect("")}
        className={`relative flex h-[43px] shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap bg-transparent px-[13px] text-xs transition-colors hover:text-[#aaa] ${
          catFilter === ""
            ? "text-[#eee] after:absolute after:-bottom-[1px] after:left-[12px] after:right-[12px] after:h-[2px] after:bg-[#ff5a1f] after:content-['']"
            : "text-[#606060]"
        }`}
      >
        <span>All categories</span>
        <small
          className={`flex min-w-[17px] h-[17px] items-center justify-center rounded-[9px] border border-[#292929] text-[8px] ${
            catFilter === "" ? "text-[#aaa]" : "text-[#4e4e4e]"
          }`}
        >
          {allCategoriesCount}
        </small>
      </button>
      {categories.map((c) => {
        const count = catCounts[c] || 0;
        return (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={`relative flex h-[43px] shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap bg-transparent px-[13px] text-xs transition-colors hover:text-[#aaa] ${
              catFilter === c
                ? "text-[#eee] after:absolute after:-bottom-[1px] after:left-[12px] after:right-[12px] after:h-[2px] after:bg-[#ff5a1f] after:content-['']"
                : "text-[#606060]"
            }`}
          >
            <span className="capitalize">{c}</span>
            <small
              className={`flex min-w-[17px] h-[17px] items-center justify-center rounded-[9px] border border-[#292929] text-[8px] ${
                catFilter === c ? "text-[#aaa]" : "text-[#4e4e4e]"
              }`}
            >
              {count}
            </small>
          </button>
        );
      })}
    </div>
  );
}
