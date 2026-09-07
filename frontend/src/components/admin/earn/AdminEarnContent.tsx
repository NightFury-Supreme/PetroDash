"use client";

import { useState } from "react";
import { PlayCircle, Link2, Info, RefreshCw, Edit2 } from "lucide-react";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { Drawer } from "@/components/ui/Drawer";

// ─── Primitives ───────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/50 mb-1.5">{children}</label>
  );
}

function FieldInput({
  type = "text", value, onChange, disabled, placeholder, min, step,
}: {
  type?: string; value: string | number; onChange: (v: string) => void;
  disabled?: boolean; placeholder?: string; min?: string; step?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      disabled={disabled} placeholder={placeholder} min={min} step={step}
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

function SaveButton({ onClick, loading, label }: { onClick: () => Promise<void>; loading: boolean; label: string }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleClick = async () => {
    try {
      await onClick();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (_) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const bg = status === "success" ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-600" 
           : status === "error" ? "bg-red-500 border-red-500 hover:bg-red-600" 
           : "bg-[#FF5722] border-[#FF5722] hover:bg-[#FF5722]/90";

  return (
    <button
      onClick={handleClick} disabled={loading || status !== "idle"}
      className={`flex w-full items-center justify-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed h-11 ${bg}`}
    >
      {loading ? <><RefreshCw size={15} className="animate-spin" />Saving...</> 
       : status === "success" ? "Saved!" 
       : status === "error" ? "Failed to Save" 
       : label}
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AdminEarnContent({
  form, saving, onChange, onSaveAds, onSaveLinkvertise,
}: {
  form: AdminEarnSettings; saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveAds: () => Promise<void>; onSaveLinkvertise: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<"ads" | "linkvertise" | null>(null);
  const sf = (path: string, value: any) => onChange(path, value);

  const cols = "lg:grid-cols-[1.5fr_2fr_100px_100px_100px_80px]";

  return (
    <div className="mt-8">
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
          <span>Method</span>
          <span>Description</span>
          <span>Reward</span>
          <span>Daily Limit</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-[#222]">
          {/* Watch Ads Row */}
          <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
            {/* Method Name */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Method</p>
              <div className="flex items-center gap-2 text-[#DDDDDD] text-sm font-mono">
                <PlayCircle size={14} className="text-[#888]" />
                <span className="truncate block">Watch Ads</span>
              </div>
            </div>

            {/* Description */}
            <div className="min-w-0 hidden lg:block">
              <p className="text-xs text-[#888] truncate">Proof-based rewarded video via ayeT callbacks.</p>
            </div>

            {/* Reward */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Reward</p>
              <span className="text-sm text-[#AAAAAA]">{form.ads.coins} coins</span>
            </div>

            {/* Limit */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Daily Limit</p>
              <span className="text-sm text-[#AAAAAA]">{form.ads.maxClaimsPerDay} claims</span>
            </div>

            {/* Status */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Status</p>
              {form.ads.enabled ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
              )}
            </div>

            {/* Actions */}
            <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
              <div className="flex lg:justify-end gap-2">
                <button
                  onClick={() => setEditing("ads")}
                  title="Configure method"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-white transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Linkvertise Row */}
          <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
            {/* Method Name */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Method</p>
              <div className="flex items-center gap-2 text-[#DDDDDD] text-sm font-mono">
                <Link2 size={14} className="text-[#888]" />
                <span className="truncate block">Linkvertise</span>
              </div>
            </div>

            {/* Description */}
            <div className="min-w-0 hidden lg:block">
              <p className="text-xs text-[#888] truncate">Link tasks with anti-bypass protection.</p>
            </div>

            {/* Reward */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Reward</p>
              <span className="text-sm text-[#AAAAAA]">{form.linkvertise.coins} coins</span>
            </div>

            {/* Limit */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Daily Limit</p>
              <span className="text-sm text-[#AAAAAA]">{form.linkvertise.maxClaimsPerDay} claims</span>
            </div>

            {/* Status */}
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Status</p>
              {form.linkvertise.enabled ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
              )}
            </div>

            {/* Actions */}
            <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
              <div className="flex lg:justify-end gap-2">
                <button
                  onClick={() => setEditing("linkvertise")}
                  title="Configure method"
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-white transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Watch Ads Drawer */}
      <Drawer
        isOpen={editing === "ads"}
        onClose={() => setEditing(null)}
        title="Configure Watch Ads"
        subtitle="Proof-based rewarded video via ayeT callbacks."
        icon={<PlayCircle size={20} />}
        footer={
          <div className="w-full">
            <SaveButton onClick={async () => { await onSaveAds(); setEditing(null); }} loading={saving} label="Save Changes" />
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Coins per claim</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).coins ?? 0} onChange={(v) => sf("ads.coins", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Max claims per day</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).maxClaimsPerDay ?? 0} onChange={(v) => sf("ads.maxClaimsPerDay", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Cooldown (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).cooldownSeconds ?? 0} onChange={(v) => sf("ads.cooldownSeconds", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Wait time (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.ads as any).waitSeconds ?? 0} onChange={(v) => sf("ads.waitSeconds", Number(v))} disabled={saving} />
            </div>
          </div>
          <hr className="border-white/[0.06]" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Placement ID <span className="text-[#FF5722]">*</span></FieldLabel>
              <FieldInput type="number" min="0" step="1" value={Number((form.ads as any).ayetPlacementId ?? 0)} onChange={(v) => sf("ads.ayetPlacementId", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>AdSlot Name <span className="text-[#FF5722]">*</span></FieldLabel>
              <FieldInput value={String((form.ads as any).ayetAdslotName ?? "")} onChange={(v) => sf("ads.ayetAdslotName", v)} disabled={saving} placeholder="your_adslot_name" />
            </div>
          </div>
          <div>
            <FieldLabel>API Key <span className="text-[#FF5722]">*</span></FieldLabel>
            <FieldInput value={String((form.ads as any).ayetApiKey ?? "")} onChange={(v) => sf("ads.ayetApiKey", v)} disabled={saving} placeholder="Paste from ayeT dashboard" />
            <FieldHint>Callback URL: {String(process.env.NEXT_PUBLIC_API_BASE || "")}/api/earn/ads/ayet/callback</FieldHint>
          </div>
        </div>
      </Drawer>

      {/* Linkvertise Drawer */}
      <Drawer
        isOpen={editing === "linkvertise"}
        onClose={() => setEditing(null)}
        title="Configure Linkvertise"
        subtitle="Link tasks with anti-bypass protection."
        icon={<Link2 size={20} />}
        footer={
          <div className="w-full">
            <SaveButton onClick={async () => { await onSaveLinkvertise(); setEditing(null); }} loading={saving} label="Save Changes" />
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Coins per claim</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).coins ?? 0} onChange={(v) => sf("linkvertise.coins", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Max claims per day</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).maxClaimsPerDay ?? 0} onChange={(v) => sf("linkvertise.maxClaimsPerDay", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Cooldown (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).cooldownSeconds ?? 0} onChange={(v) => sf("linkvertise.cooldownSeconds", Number(v))} disabled={saving} />
            </div>
            <div>
              <FieldLabel>Wait time (seconds)</FieldLabel>
              <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).waitSeconds ?? 0} onChange={(v) => sf("linkvertise.waitSeconds", Number(v))} disabled={saving} />
            </div>
          </div>
          <hr className="border-white/[0.06]" />
          <div>
            <FieldLabel>URL Template <span className="text-[#FF5722]">*</span></FieldLabel>
            <FieldInput value={(form.linkvertise as any).url ?? ""} onChange={(v) => sf("linkvertise.url", v)} disabled={saving} placeholder="https://link-to.net/.../dynamic?r={targetB64}" />
            <FieldHint>Use {"{target}"} or {"{targetB64}"} placeholders in the URL.</FieldHint>
          </div>
          <div>
            <FieldLabel>Anti-Bypass Token</FieldLabel>
            <FieldInput value={(form.linkvertise as any).antiBypassToken ?? ""} onChange={(v) => sf("linkvertise.antiBypassToken", v)} disabled={saving} placeholder="Leave blank to disable anti-bypass" />
            <FieldHint>If set, claims require a valid anti-bypass hash (proof-based).</FieldHint>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
