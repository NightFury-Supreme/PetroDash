
import React from 'react';

export function SecurityItem({ icon, title, description, action, status, onAction }: any) {
  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#D4D4D4]">{title}</p>
            <p className="mt-1 text-xs text-[#888]">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:shrink-0 justify-end">
          {status && (typeof status === 'string' ? <span className="shrink-0 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">{status}</span> : status)}
          {action && (
            typeof action === 'string' ? (
              <button type="button" onClick={onAction} className="shrink-0 h-9 rounded-lg border border-[#222] bg-[#1A1A1A] px-4 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition">
                {action}
              </button>
            ) : action
          )}
        </div>
      </div>
    </div>
  );
}

