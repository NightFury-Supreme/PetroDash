import React from "react";

export function CredentialRow({
  icon,
  label,
  description,
  value,
  action,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: string;
  action: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(250px,1fr)_1fr_120px] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/50">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-0.5 text-[11px] text-white/40">{description}</p>
        </div>
      </div>

      <div className="flex items-center min-w-0">
        <p
          className={`truncate text-sm text-white/70 ${
            mono ? "font-mono text-white/50" : ""
          }`}
        >
          {value}
        </p>
      </div>

      <div className="flex items-center justify-end">{action}</div>
    </div>
  );
}
