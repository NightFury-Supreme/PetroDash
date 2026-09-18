import React from 'react';

export function AdminSideItem({ icon: Icon, label, active, danger, onClick }: { icon: any; label: string; active?: boolean; danger?: boolean; onClick: () => void; }) {
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
                : "bg-white/10 text-white"
            : danger
                ? "text-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}
