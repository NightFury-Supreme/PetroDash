"use client";

import { LayoutGrid, ClipboardList } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/ToastProvider";
import { ActionButton, FieldLabel, FieldInput, FieldHint } from "../EarnUI";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";

export interface AyetWallDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSave: (override?: { enabled: boolean }) => Promise<void>;
  type: "offerwall" | "surveywall";
}

export function AyetWallDrawer({
  isOpen,
  onClose,
  form,
  saving,
  onChange,
  onSave,
  type,
}: AyetWallDrawerProps) {
  const sf = (path: string, value: any) => onChange(path, value);
  const data = form[type];
  const isOfferwall = type === "offerwall";
  const { showSuccess, showError } = useToast();
  const label = isOfferwall ? "Offerwall" : "Surveywall";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isOfferwall ? "Configure Offerwall" : "Configure Surveywall"}
      subtitle={`Integrate ayeT-Studios ${label}`}
      icon={isOfferwall ? <LayoutGrid size={20} /> : <ClipboardList size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          {data?.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={async () => { await onSave({ enabled: false }); }}
                  loading={saving}
                  label="Disable"
                  variant="danger"
                  onSuccess={() => { showSuccess(`${label} disabled.`); onClose(); }}
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
                  onClick={async () => { await onSave(); }}
                  loading={saving}
                  label="Save Changes"
                  onSuccess={() => { showSuccess(`${label} settings saved.`); onClose(); }}
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
                onClick={async () => { await onSave({ enabled: true }); }}
                loading={saving}
                label="Enable Method"
                onSuccess={() => { showSuccess(`${label} enabled.`); onClose(); }}
                onError={(e) => showError(e)}
              />
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-5 px-5 py-6">
        <div>
          <FieldLabel>Adslot ID</FieldLabel>
          <FieldInput
            type="text"
            value={data?.adslotId || ""}
            onChange={(v) => sf(`${type}.adslotId`, v)}
            placeholder="e.g. 12345"
            disabled={saving}
          />
          <FieldHint>Find this in your ayeT-Studios Publisher dashboard.</FieldHint>
        </div>
        <div>
          <FieldLabel>Publisher API Key</FieldLabel>
          <FieldInput
            type="text"
            value={data?.apiKey || ""}
            onChange={(v) => sf(`${type}.apiKey`, v)}
            placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            disabled={saving}
          />
          <FieldHint>Used to securely verify S2S callbacks using HMAC-SHA256.</FieldHint>
        </div>
      </div>
    </Drawer>
  );
}
