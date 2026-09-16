'use client';

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">{children}</label>;
}

export function FieldInput({
  type = "text", value, onChange, disabled = false, min, step, placeholder
}: {
  type?: string; value: string | number; onChange: (v: string) => void; disabled?: boolean; min?: string; step?: string; placeholder?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} min={min} step={step} placeholder={placeholder}
      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50"
    />
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-[#555] mt-2 font-mono">{children}</p>;
}

export function ActionButton({
  onClick, loading, label, variant = "primary", className = "", icon, onSuccess, onError, disabled: externalDisabled = false, title
}: {
  onClick: () => Promise<void>;
  loading: boolean;
  label: string;
  variant?: "primary" | "danger";
  className?: string;
  icon?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (err: string) => void;
  disabled?: boolean;
  title?: string;
}) {
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    if (running || loading || externalDisabled) return;
    setRunning(true);
    try {
      await onClick();
      onSuccess?.();
    } catch (err: any) {
      onError?.(err?.message ?? "Something went wrong");
    } finally {
      setRunning(false);
    }
  };

  const isDisabled = running || loading || externalDisabled;
  const isLoading = running; // Only THIS button shows "Saving..." when it was the one clicked

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title={title}
      className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
        isLoading
          ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
          : isDisabled
          ? "opacity-50 cursor-not-allowed " + (variant === "danger"
              ? "border border-red-500/20 bg-red-500/10 text-red-500"
              : "bg-[#FF5722] border border-[#FF5722] text-white")
          : variant === "danger"
          ? "border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
          : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
      } ${className}`}
    >
      {isLoading ? (
        <><Loader2 size={16} className="animate-spin" /> Saving...</>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
