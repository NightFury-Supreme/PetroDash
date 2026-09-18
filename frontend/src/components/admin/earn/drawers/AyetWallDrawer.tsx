import { LayoutGrid, ClipboardList, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isOfferwall ? "Configure Offerwall" : "Configure Surveywall"}
      subtitle={`Integrate ayeT-Studios ${isOfferwall ? "Offerwall" : "Surveywall"}`}
      icon={isOfferwall ? <LayoutGrid size={20} /> : <ClipboardList size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          {data?.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <ActionButton 
                  onClick={async () => { await onSave({ enabled: false }); setTimeout(onClose, 1000); }} 
                  loading={saving} label="Disable" variant="danger" icon={<Trash2 size={15} />} 
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">Cancel</button>
                <ActionButton onClick={async () => { await onSave(); setTimeout(onClose, 1000); }} loading={saving} label="Save Changes" />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-2">
              <button onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">Cancel</button>
              <ActionButton onClick={async () => { await onSave({ enabled: true }); setTimeout(onClose, 1000); }} loading={saving} label="Enable Method" />
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
            placeholder={`e.g. 12345`}
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
          />
          <FieldHint>Used to securely verify S2S callbacks using HMAC-SHA256.</FieldHint>
        </div>
      </div>
    </Drawer>
  );
}
