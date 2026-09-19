"use client";

import { PlayCircle } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/ToastProvider";
import { ActionButton, FieldLabel, FieldInput, FieldHint } from "../EarnUI";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";

export interface AdsConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveAds: (override?: { enabled: boolean }) => Promise<void>;
}

export function AdsConfigDrawer({
  isOpen,
  onClose,
  form,
  saving,
  onChange,
  onSaveAds,
}: AdsConfigDrawerProps) {
  const sf = (path: string, value: any) => onChange(path, value);
  const { showSuccess, showError } = useToast();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Watch Ads"
      subtitle="Proof-based rewarded video via ayeT callbacks."
      icon={<PlayCircle size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          {form.ads?.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={async () => { await onSaveAds({ enabled: false }); }}
                  loading={saving}
                  label="Disable"
                  variant="danger"
                  onSuccess={() => { showSuccess("Ads disabled successfully."); onClose(); }}
                  onError={(e) => showError(e)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <ActionButton
                  onClick={async () => { await onSaveAds(); }}
                  loading={saving}
                  label="Save Changes"
                  onSuccess={() => { showSuccess("Ads settings saved."); onClose(); }}
                  onError={(e) => showError(e)}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <ActionButton
                onClick={async () => { await onSaveAds({ enabled: true }); }}
                loading={saving}
                label="Enable Method"
                onSuccess={() => { showSuccess("Ads method enabled."); onClose(); }}
                onError={(e) => showError(e)}
              />
            </div>
          )}
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
  );
}
