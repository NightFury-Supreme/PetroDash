import React from 'react';

export interface AdminSideItemProps {
  icon: any;
  label: string;
  active?: boolean;
  danger?: boolean;
  success?: boolean;
  onClick: () => void;
}

export function AdminSideItem({
  icon: Icon,
  label,
  active,
  danger,
  success,
  onClick,
}: AdminSideItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2.5
        py-2
        text-left
        text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-1
        focus-visible:ring-white/30

        ${
          active
            ? danger
              ? "bg-red-500/10 text-red-500"
              : success
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-white/10 text-white"
            : danger
            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            : success
            ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}
