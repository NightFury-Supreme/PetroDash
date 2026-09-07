"use client";

import { Info, RefreshCw } from "lucide-react";
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
      className="flex items-center justify-center gap-2 border px-5 py-2 rounded-lg text-sm font-medium transition-colors bg-[#FF5722] border-[#FF5722] text-white hover:bg-[#FF5722]/90 disabled:opacity-50 disabled:cursor-not-allowed h-10"
    >
      {loading ? (
        <>
          <RefreshCw size={14} className="animate-spin" />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function AdminEarnContent({
  form,
  saving,
  onChange,
  onSaveAds,
  onSaveLinkvertise,
  activeMethod,
}: {
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveAds: () => void;
  onSaveLinkvertise: () => void;
  activeMethod: "ads" | "linkvertise";
}) {
  const setField = (path: string, value: any) => onChange(path, value);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">

      {/* ── Watch Ads panel ── */}
      {activeMethod === "ads" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Watch Ads</h2>
            <p className="text-[13px] text-white/50 mt-1">Proof-based rewarded video via ayeT callbacks.</p>
          </div>

          <div className="space-y-6">
            <SectionDivider label="Rewards" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Coins per claim</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.ads as any).coins ?? 0} onChange={(v) => setField("ads.coins", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>Max claims per day</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.ads as any).maxClaimsPerDay ?? 0} onChange={(v) => setField("ads.maxClaimsPerDay", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>Cooldown (seconds)</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.ads as any).cooldownSeconds ?? 0} onChange={(v) => setField("ads.cooldownSeconds", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>Wait time (seconds)</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.ads as any).waitSeconds ?? 0} onChange={(v) => setField("ads.waitSeconds", Number(v))} disabled={saving} />
              </div>
            </div>

            <SectionDivider label="ayeT Integration" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Placement ID <span className="text-[#FF5722]">*</span></FieldLabel>
                <FieldInput type="number" min="0" step="1" value={Number((form.ads as any).ayetPlacementId ?? 0)} onChange={(v) => setField("ads.ayetPlacementId", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>AdSlot Name <span className="text-[#FF5722]">*</span></FieldLabel>
                <FieldInput value={String((form.ads as any).ayetAdslotName ?? "")} onChange={(v) => setField("ads.ayetAdslotName", v)} disabled={saving} placeholder="your_adslot_name" />
              </div>
            </div>
            <div>
              <FieldLabel>API Key <span className="text-[#FF5722]">*</span></FieldLabel>
              <FieldInput value={String((form.ads as any).ayetApiKey ?? "")} onChange={(v) => setField("ads.ayetApiKey", v)} disabled={saving} placeholder="Paste from ayeT dashboard" />
              <FieldHint>Callback URL: {String(process.env.NEXT_PUBLIC_API_BASE || "")}/api/earn/ads/ayet/callback</FieldHint>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
            <SaveButton onClick={onSaveAds} loading={saving} label="Save Watch Ads" />
            <span className="text-xs text-white/30">
              Status: {form.ads.enabled
                ? <span className="text-emerald-400 font-medium">Enabled</span>
                : <span className="text-white/40">Disabled — fill required fields to enable</span>}
            </span>
          </div>
        </div>
      )}

      {/* ── Linkvertise panel ── */}
      {activeMethod === "linkvertise" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Linkvertise</h2>
            <p className="text-[13px] text-white/50 mt-1">Link tasks with anti-bypass protection.</p>
          </div>

          <div className="space-y-6">
            <SectionDivider label="Rewards" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Coins per claim</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).coins ?? 0} onChange={(v) => setField("linkvertise.coins", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>Max claims per day</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).maxClaimsPerDay ?? 0} onChange={(v) => setField("linkvertise.maxClaimsPerDay", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>Cooldown (seconds)</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).cooldownSeconds ?? 0} onChange={(v) => setField("linkvertise.cooldownSeconds", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>Wait time (seconds)</FieldLabel>
                <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).waitSeconds ?? 0} onChange={(v) => setField("linkvertise.waitSeconds", Number(v))} disabled={saving} />
              </div>
            </div>

            <SectionDivider label="Linkvertise Integration" />
            <div>
              <FieldLabel>URL Template <span className="text-[#FF5722]">*</span></FieldLabel>
              <FieldInput value={(form.linkvertise as any).url ?? ""} onChange={(v) => setField("linkvertise.url", v)} disabled={saving} placeholder="https://link-to.net/.../dynamic?r={targetB64}" />
              <FieldHint>Use {"{target}"} or {"{targetB64}"} placeholders in the URL.</FieldHint>
            </div>
            <div>
              <FieldLabel>Anti-Bypass Token</FieldLabel>
              <FieldInput value={(form.linkvertise as any).antiBypassToken ?? ""} onChange={(v) => setField("linkvertise.antiBypassToken", v)} disabled={saving} placeholder="Leave blank to disable anti-bypass" />
              <FieldHint>If set, claims require a valid anti-bypass hash (proof-based).</FieldHint>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
            <SaveButton onClick={onSaveLinkvertise} loading={saving} label="Save Linkvertise" />
            <span className="text-xs text-white/30">
              Status: {form.linkvertise.enabled
                ? <span className="text-emerald-400 font-medium">Enabled</span>
                : <span className="text-white/40">Disabled — fill required fields to enable</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


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
    <div className="mt-8">
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
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Coins per claim</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).coins ?? 0} onChange={(v) => setField("ads.coins", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Max claims per day</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).maxClaimsPerDay ?? 0} onChange={(v) => setField("ads.maxClaimsPerDay", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Cooldown (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).cooldownSeconds ?? 0} onChange={(v) => setField("ads.cooldownSeconds", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Wait time (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).waitSeconds ?? 0} onChange={(v) => setField("ads.waitSeconds", Number(v))} disabled={saving} />
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>ayeT Placement ID <span className="text-[#FF5722]">*</span></FieldLabel>
                <FieldInput type="number" min="0" step="1" value={Number((form.ads as any).ayetPlacementId ?? 0)} onChange={(v) => setField("ads.ayetPlacementId", Number(v))} disabled={saving} />
              </div>
              <div>
                <FieldLabel>ayeT AdSlot Name <span className="text-[#FF5722]">*</span></FieldLabel>
                <FieldInput value={String((form.ads as any).ayetAdslotName ?? "")} onChange={(v) => setField("ads.ayetAdslotName", v)} disabled={saving} placeholder="{your_adslot_name}" />
              </div>
            </div>
            <div>
              <FieldLabel>ayeT API Key <span className="text-[#FF5722]">*</span></FieldLabel>
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
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Coins per claim</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).coins ?? 0} onChange={(v) => setField("linkvertise.coins", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Max claims per day</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).maxClaimsPerDay ?? 0} onChange={(v) => setField("linkvertise.maxClaimsPerDay", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Cooldown (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).cooldownSeconds ?? 0} onChange={(v) => setField("linkvertise.cooldownSeconds", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Wait time (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).waitSeconds ?? 0} onChange={(v) => setField("linkvertise.waitSeconds", Number(v))} disabled={saving} />
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          <div className="space-y-4">
            <div>
              <FieldLabel>Linkvertise URL Template <span className="text-[#FF5722]">*</span></FieldLabel>
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
