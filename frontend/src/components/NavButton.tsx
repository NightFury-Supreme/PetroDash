"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import type { NavLink } from "./sidebarLinks";

interface NavButtonProps {
  item: NavLink;
  collapsed: boolean;
  isActive: boolean;
  label: string;
}

export function NavButton({
  item,
  collapsed,
  isActive,
  label,
}: NavButtonProps) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="block">
      <div
        title={collapsed ? label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }`}
      >
        <Icon size={17} strokeWidth={1.75} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
    </Link>
  );
}
