import { Link2, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { ActionButton, FieldLabel, FieldInput, FieldHint } from "../EarnUI";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";

export interface LinkvertiseConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveLinkvertise: (override?: { enabled: boolean }) => Promise<void>;
}

export function LinkvertiseConfigDrawer({
  isOpen,
  onClose,
  form,
  saving,
  onChange,
  onSaveLinkvertise,
}: LinkvertiseConfigDrawerProps) {
  const sf = (path: string, value: any) => onChange(path, value);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Linkvertise"
      subtitle="Link tasks with anti-bypass protection."
      icon={<Link2 size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          {form.linkvertise.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <ActionButton 
                  onClick={async () => { await onSaveLinkvertise({ enabled: false }); setTimeout(onClose, 1000); }} 
                  loading={saving} label="Disable" variant="danger" icon={<Trash2 size={15} />} 
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">Cancel</button>
                <ActionButton onClick={async () => { await onSaveLinkvertise(); setTimeout(onClose, 1000); }} loading={saving} label="Save Changes" />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-2">
              <button onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">Cancel</button>
              <ActionButton onClick={async () => { await onSaveLinkvertise({ enabled: true }); setTimeout(onClose, 1000); }} loading={saving} label="Enable Method" />
            </div>
          )}
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
          <FieldLabel>Publisher ID <span className="text-[#FF5722]">*</span></FieldLabel>
          <FieldInput value={(form.linkvertise as any).publisherId ?? ""} onChange={(v) => sf("linkvertise.publisherId", v)} disabled={saving} placeholder="e.g. 1412952" />
          <FieldHint>Your Linkvertise Publisher ID. Links are generated automatically via the Full Script API approach.</FieldHint>
        </div>
        <div>
          <FieldLabel>Anti-Bypass Token</FieldLabel>
          <FieldInput value={(form.linkvertise as any).antiBypassToken ?? ""} onChange={(v) => sf("linkvertise.antiBypassToken", v)} disabled={saving} placeholder="Leave blank to disable anti-bypass" />
          <FieldHint>If set, claims require a valid anti-bypass hash (proof-based).</FieldHint>
        </div>
      </div>
    </Drawer>
  );
}
