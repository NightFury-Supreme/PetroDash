import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { Select } from "@/components/ui/Select";
import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Loader2, Plus, Coins, Cpu, MemoryStick, HardDrive, Server, Tag, FileText, Infinity } from "lucide-react";

export function AdminCreateGiftDrawer({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    maxRedemptions: 0,
    validFrom: "",
    validUntil: "",
    enabled: true,
    coins: 0,
    cpuPercent: 0,
    memoryMb: 0,
    diskMb: 0,
    serverSlots: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        code: "",
        description: "",
        maxRedemptions: 0,
        validFrom: "",
        validUntil: "",
        enabled: true,
        coins: 0,
        cpuPercent: 0,
        memoryMb: 0,
        diskMb: 0,
        serverSlots: 0,
      });
      setError(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      
      const body = {
        code: form.code.toUpperCase(),
        description: form.description,
        enabled: form.enabled,
        maxRedemptions: Number(form.maxRedemptions),
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        rewards: {
          coins: Number(form.coins),
          resources: {
            cpuPercent: Number(form.cpuPercent),
            memoryMb: Number(form.memoryMb),
            diskMb: Number(form.diskMb),
            serverSlots: Number(form.serverSlots),
          }
        }
      };

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create gift");
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = form.code.trim().length > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Gift"
      subtitle="Generate a new redeemable coupon code"
      icon={<Plus size={20} />}
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <button onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={saving || !isFormValid}
            className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              saving || !isFormValid
                ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
            }`}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Gift"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Tag size={12} /> Code *</label>
            <input 
              value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={saving} placeholder="SUMMER2026"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 uppercase" 
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><FileText size={12} /> Description</label>
            <input 
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={saving} placeholder="Short description of the gift"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" 
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Infinity size={12} /> Max Uses (0 = ∞)</label>
            <input type="number" min="0" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Enabled</label>
            <Select value={form.enabled ? "true" : "false"} onChange={(val) => setForm({ ...form, enabled: val === "true" })} disabled={saving} options={[{label: "Yes", value: "true"}, {label: "No", value: "false"}]} size="md" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Valid From</label>
            <input type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#888] focus:text-white focus:outline-none focus:border-[#FF5722]/50" />
            <p className="text-[10px] text-[#555] mt-1">Leave blank to start immediately</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Valid Until</label>
            <input type="datetime-local" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#888] focus:text-white focus:outline-none focus:border-[#FF5722]/50" />
            <p className="text-[10px] text-[#555] mt-1">Leave blank to never expire</p>
          </div>
        </div>

        <hr className="border-white/[0.06]" />

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Rewards</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Coins size={12} className="text-[#666]" /> Coins</label>
              <input type="number" min="0" value={form.coins} onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Cpu size={12} className="text-[#666]" /> CPU (%)</label>
              <input type="number" min="0" value={form.cpuPercent} onChange={(e) => setForm({ ...form, cpuPercent: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><MemoryStick size={12} className="text-[#666]" /> RAM (MB)</label>
              <input type="number" min="0" value={form.memoryMb} onChange={(e) => setForm({ ...form, memoryMb: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><HardDrive size={12} className="text-[#666]" /> Disk (MB)</label>
              <input type="number" min="0" value={form.diskMb} onChange={(e) => setForm({ ...form, diskMb: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Server size={12} className="text-[#666]" /> Slots</label>
              <input type="number" min="0" value={form.serverSlots} onChange={(e) => setForm({ ...form, serverSlots: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
