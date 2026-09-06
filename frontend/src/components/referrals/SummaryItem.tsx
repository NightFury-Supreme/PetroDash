import React from "react";

export function SummaryItem({
  icon,
  label,
  value,
  suffix,
  accent = false,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 sm:border-r sm:border-white/[0.06] last:border-r-0">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          accent ? "bg-orange-500/[0.07]" : "bg-white/[0.04]"
        }`}
      >
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: accent ? "text-orange-400" : "text-white/40",
        })}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/20">
          {label}
        </p>

        <div className="mt-1 flex items-baseline gap-1.5">
          {loading ? (
            <div className="h-8 w-16 rounded-md bg-white/[0.04] animate-pulse" />
          ) : (
            <>
              <span
                className={`text-2xl font-semibold ${
                  accent ? "text-orange-400" : "text-white"
                }`}
              >
                {value}
              </span>
              <span className="text-[10px] text-white/20">{suffix}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
