"use client";

import { useState } from "react";
import { PlayCircle, Link2, Info, RefreshCw, ChevronRight } from "lucide-react";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";

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
      className="flex items-center justify-center gap-2 border px-4 py-2 rounded-md text-xs font-medium transition-colors bg-[#1A0F0C] border-[#FF5722]/30 text-[#FF5722] hover:bg-[#FF5722]/10 disabled:opacity-40 disabled:cursor-not-allowed h-9"
    >
      {loading ? (
        <>
          <RefreshCw size={13} className="animate-spin text-[#FF5722]" />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
        <p className="text-[13px] text-[#888888] mt-1">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────

type NavSection = "ads" | "linkvertise";

function SideNav({
  active,
  onChange,
}: {
  active: NavSection;
  onChange: (s: NavSection) => void;
}) {
  const items: { id: NavSection; label: string; icon: React.ElementType }[] = [
    { id: "ads", label: "Watch Ads", icon: PlayCircle },
    { id: "linkvertise", label: "Linkvertise", icon: Link2 },
  ];

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none ${
              isActive
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <Icon size={17} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {isActive && (
              <ChevronRight size={14} className="shrink-0 text-white/30" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

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
  const [activeSection, setActiveSection] = useState<NavSection>("ads");

  const setField = (path: string, value: any) => onChange(path, value);

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mt-6">
      {/* Sidebar */}
      <aside className="w-full md:w-56 shrink-0">
        <SideNav
          active={activeSection}
          onChange={setActiveSection}
        />
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === "ads" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionHeader
              title="Watch Ads"
              description="Proof-based rewarded video via ayeT callbacks."
              action={
                <Toggle
                  checked={!!form.ads.enabled}
                  onChange={(v) => setField("ads.enabled", v)}
                  disabled={saving}
                />
              }
            />

            <div className={`transition-opacity ${(!form.ads.enabled) ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/[0.06] mb-6">
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

              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-white/[0.06] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel>ayeT Placement ID</FieldLabel>
                    <FieldInput type="number" min="0" step="1" value={Number((form.ads as any).ayetPlacementId ?? 0)} onChange={(v) => setField("ads.ayetPlacementId", Number(v))} disabled={saving} />
                  </div>
                  <div>
                    <FieldLabel>ayeT AdSlot Name</FieldLabel>
                    <FieldInput value={String((form.ads as any).ayetAdslotName ?? "")} onChange={(v) => setField("ads.ayetAdslotName", v)} disabled={saving} placeholder="{your_rewarded_video_adslot_name}" />
                  </div>
                </div>
                <div>
                  <FieldLabel>ayeT API Key</FieldLabel>
                  <FieldInput value={String((form.ads as any).ayetApiKey ?? "")} onChange={(v) => setField("ads.ayetApiKey", v)} disabled={saving} placeholder="Paste from ayeT dashboard" />
                  <FieldHint>Callback URL: {String(process.env.NEXT_PUBLIC_API_BASE || "")}/api/earn/ads/ayet/callback</FieldHint>
                </div>
              </div>

              <div className="pt-2">
                <SaveButton onClick={onSaveAds} loading={saving} label="Save Watch Ads" />
              </div>
            </div>
          </div>
        )}

        {activeSection === "linkvertise" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionHeader
              title="Linkvertise"
              description="Link tasks with anti-bypass protection."
              action={
                <Toggle
                  checked={!!form.linkvertise.enabled}
                  onChange={(v) => setField("linkvertise.enabled", v)}
                  disabled={saving}
                />
              }
            />

            <div className={`transition-opacity ${(!form.linkvertise.enabled) ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/[0.06] mb-6">
                <div>
                  <FieldLabel>Coins / claim</FieldLabel>
                  <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).coins ?? 0} onChange={(v) => setField("linkvertise.coins", Number(v))} disabled={saving} />
                </div>
                <div>
                  <FieldLabel>Max / day</FieldLabel>
                  <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).maxClaimsPerDay ?? 0} onChange={(v) => setField("linkvertise.maxClaimsPerDay", Number(v))} disabled={saving} />
                </div>
                <div>
                  <FieldLabel>Wait (s)</FieldLabel>
                  <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).waitSeconds ?? 0} onChange={(v) => setField("linkvertise.waitSeconds", Number(v))} disabled={saving} />
                </div>
                <div>
                  <FieldLabel>Cooldown (s)</FieldLabel>
                  <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).cooldownSeconds ?? 0} onChange={(v) => setField("linkvertise.cooldownSeconds", Number(v))} disabled={saving} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-white/[0.06] mb-6">
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

              <div className="pt-2">
                <SaveButton onClick={onSaveLinkvertise} loading={saving} label="Save Linkvertise" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
