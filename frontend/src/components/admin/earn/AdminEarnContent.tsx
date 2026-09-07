"use client";

import { useState } from "react";
import { PlayCircle, Link2, Info, RefreshCw, ChevronRight } from "lucide-react";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { Drawer } from "@/components/ui/Drawer";

// ─── Shared primitives ────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/50 mb-1.5">
      {children}
    </label>
  );
}

function FieldInput({
  type = "text",
  value,
  onChange,
  disabled,
  placeholder,
  min,
  step,
}: {
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      min={min}
      step={step}
      className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#141414] px-4 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]/50 focus:ring-1 focus:ring-[#FF5722]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-white/20"
    />
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-white/30 leading-relaxed">
      <Info size={14} className="mt-[2px] shrink-0 text-white/20" />
      {children}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-[#FF5722]" : "bg-[#333]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-2" : "-translate-x-2"
        }`}
      />
    </button>
  );
}

function SaveButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-[#FF5722] border-[#FF5722] text-white hover:bg-[#FF5722]/90 disabled:opacity-50 disabled:cursor-not-allowed h-11"
    >
      {loading ? (
        <>
          <RefreshCw size={15} className="animate-spin" />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function AdminEarnContent({
  form,
  saving,
  onChange,
  onSaveAds,
  onSaveLinkvertise,
}: {
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveAds: () => void;
  onSaveLinkvertise: () => void;
}) {
  const [editingMethod, setEditingMethod] = useState<"ads" | "linkvertise" | null>(null);

  const setField = (path: string, value: any) => onChange(path, value);

  return (
    <div className="mt-8 max-w-5xl">
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
          Earning Methods
        </h3>
        <h2 className="text-xl font-semibold text-white tracking-tight">
          Available methods
        </h2>
        <p className="text-[13px] text-white/50 mt-1">
          Select a method to configure its earning behavior.
        </p>
      </div>

      <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
        {/* Watch Ads Row */}
        <div className="flex items-center gap-6 py-6 group">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/50 shrink-0">
            <PlayCircle size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[15px] font-medium text-white/90">Watch Ads</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20">
                AYET
              </span>
            </div>
            <p className="text-[13px] text-white/40 truncate">
              Reward users for completing advertisements.
            </p>
          </div>
          <div className="w-24 shrink-0 hidden md:block">
            <span className="block text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">Reward</span>
            <span className="text-[13px] text-white/70">{form.ads.coins} coins</span>
          </div>
          <div className="w-24 shrink-0 hidden md:block">
            <span className="block text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">Daily Limit</span>
            <span className="text-[13px] text-white/70">{form.ads.maxClaimsPerDay}</span>
          </div>
          <div className="w-24 shrink-0 hidden sm:block">
            <span className="block text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">Status</span>
            {form.ads.enabled ? (
              <span className="text-[13px] text-emerald-400 font-medium">Enabled</span>
            ) : (
              <span className="text-[13px] text-white/40 font-medium">Disabled</span>
            )}
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setEditingMethod("ads")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-white/[0.1] text-[13px] font-medium text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              Configure <ChevronRight size={14} className="text-white/40" />
            </button>
          </div>
        </div>

        {/* Linkvertise Row */}
        <div className="flex items-center gap-6 py-6 group">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/50 shrink-0">
            <Link2 size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[15px] font-medium text-white/90">Linkvertise</span>
            </div>
            <p className="text-[13px] text-white/40 truncate">
              Link tasks with anti-bypass protection.
            </p>
          </div>
          <div className="w-24 shrink-0 hidden md:block">
            <span className="block text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">Reward</span>
            <span className="text-[13px] text-white/70">{form.linkvertise.coins} coins</span>
          </div>
          <div className="w-24 shrink-0 hidden md:block">
            <span className="block text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">Daily Limit</span>
            <span className="text-[13px] text-white/70">{form.linkvertise.maxClaimsPerDay}</span>
          </div>
          <div className="w-24 shrink-0 hidden sm:block">
            <span className="block text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">Status</span>
            {form.linkvertise.enabled ? (
              <span className="text-[13px] text-emerald-400 font-medium">Enabled</span>
            ) : (
              <span className="text-[13px] text-white/40 font-medium">Disabled</span>
            )}
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setEditingMethod("linkvertise")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-white/[0.1] text-[13px] font-medium text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              Configure <ChevronRight size={14} className="text-white/40" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawers */}
      <Drawer
        isOpen={editingMethod === "ads"}
        onClose={() => setEditingMethod(null)}
        title="Configure Watch Ads"
        subtitle="Proof-based rewarded video via ayeT callbacks."
        icon={<PlayCircle size={20} />}
        headerExtra={
          <div className="flex items-center gap-3 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.05]">
            <span className="text-xs font-medium text-white/60">Enabled</span>
            <Toggle
              checked={!!form.ads.enabled}
              onChange={(v) => setField("ads.enabled", v)}
              disabled={saving}
            />
          </div>
        }
        footer={
          <div className="w-full">
            <SaveButton
              onClick={async () => {
                await onSaveAds();
                setEditingMethod(null);
              }}
              loading={saving}
              label="Save Changes"
            />
          </div>
        }
      >
        <div className={`space-y-6 ${(!form.ads.enabled) ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Coins / claim</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).coins ?? 0} onChange={(v) => setField("ads.coins", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Max / day</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).maxClaimsPerDay ?? 0} onChange={(v) => setField("ads.maxClaimsPerDay", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Cooldown (s)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).cooldownSeconds ?? 0} onChange={(v) => setField("ads.cooldownSeconds", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Wait (s)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).waitSeconds ?? 0} onChange={(v) => setField("ads.waitSeconds", Number(v))} disabled={saving} />
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>ayeT Placement ID</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={Number((form.ads as any).ayetPlacementId ?? 0)} onChange={(v) => setField("ads.ayetPlacementId", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>ayeT AdSlot Name</FieldLabel>
                <FieldInput value={String((form.ads as any).ayetAdslotName ?? "")} onChange={(v) => setField("ads.ayetAdslotName", v)} disabled={saving} placeholder="{your_adslot_name}" />
              </div>
            </div>
            <div>
              <FieldLabel>ayeT API Key</FieldLabel>
              <FieldInput value={String((form.ads as any).ayetApiKey ?? "")} onChange={(v) => setField("ads.ayetApiKey", v)} disabled={saving} placeholder="Paste from ayeT dashboard" />
              <FieldHint>Callback URL: {String(process.env.NEXT_PUBLIC_API_BASE || "")}/api/earn/ads/ayet/callback</FieldHint>
            </div>
          </div>
        </div>
      </Drawer>

      <Drawer
        isOpen={editingMethod === "linkvertise"}
        onClose={() => setEditingMethod(null)}
        title="Configure Linkvertise"
        subtitle="Link tasks with anti-bypass protection."
        icon={<Link2 size={20} />}
        headerExtra={
          <div className="flex items-center gap-3 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.05]">
            <span className="text-xs font-medium text-white/60">Enabled</span>
            <Toggle
              checked={!!form.linkvertise.enabled}
              onChange={(v) => setField("linkvertise.enabled", v)}
              disabled={saving}
            />
          </div>
        }
        footer={
          <div className="w-full">
            <SaveButton
              onClick={async () => {
                await onSaveLinkvertise();
                setEditingMethod(null);
              }}
              loading={saving}
              label="Save Changes"
            />
          </div>
        }
      >
        <div className={`space-y-6 ${(!form.linkvertise.enabled) ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Coins / claim</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).coins ?? 0} onChange={(v) => setField("linkvertise.coins", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Max / day</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).maxClaimsPerDay ?? 0} onChange={(v) => setField("linkvertise.maxClaimsPerDay", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Cooldown (s)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).cooldownSeconds ?? 0} onChange={(v) => setField("linkvertise.cooldownSeconds", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Wait (s)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).waitSeconds ?? 0} onChange={(v) => setField("linkvertise.waitSeconds", Number(v))} disabled={saving} />
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          <div className="space-y-4">
            <div>
              <FieldLabel>Linkvertise URL Template</FieldLabel>
              <FieldInput value={(form.linkvertise as any).url ?? ""} onChange={(v) => setField("linkvertise.url", v)} disabled={saving} placeholder="https://link-to.net/.../dynamic?r={targetB64}" />
              <FieldHint>Use {"{target}"} or {"{targetB64}"} placeholders in the URL.</FieldHint>
            </div>
            <div>
              <FieldLabel>Anti-Bypass Token</FieldLabel>
              <FieldInput value={(form.linkvertise as any).antiBypassToken ?? ""} onChange={(v) => setField("linkvertise.antiBypassToken", v)} disabled={saving} placeholder="Leave blank to disable anti-bypass" />
              <FieldHint>If set, claims require a valid anti-bypass hash (proof-based).</FieldHint>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
