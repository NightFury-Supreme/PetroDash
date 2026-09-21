import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { Select } from "@/components/ui/Select";
import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import AdminEditGiftSkeleton from "@/components/skeletons/admin/gifts/AdminEditGiftSkeleton";
import { AdminDeleteGiftDrawer } from "./AdminDeleteGiftDrawer";
import { Loader2, Edit2, Tag, FileText, Infinity, Coins, Cpu, MemoryStick, HardDrive, Server } from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminEditGiftDrawer({
  isOpen,
  onClose,
  onSuccess,
  giftId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  giftId: string | null;
}) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('GlobalErrors');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

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

  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isOpen && giftId) {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts/${giftId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setForm({
          code: data.code || "",
          description: data.description || "",
          maxRedemptions: data.maxRedemptions || 0,
          validFrom: formatDateForInput(data.validFrom),
          validUntil: formatDateForInput(data.validUntil),
          enabled: data.enabled ?? true,
          coins: data.rewards?.coins || 0,
          cpuPercent: data.rewards?.resources?.cpuPercent || 0,
          memoryMb: data.rewards?.resources?.memoryMb || 0,
          diskMb: data.rewards?.resources?.diskMb || 0,
          serverSlots: data.rewards?.resources?.serverSlots || 0,
        });
      })
      .catch(e => {
        const errKey = e.message || 'fetch_failed';
        setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : e.message);
      })
      .finally(() => setLoading(false));
    }
  }, [isOpen, giftId, tErrorBackend]);

  const handleUpdate = async () => {
    if (!giftId) return;
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("auth_token");

      const body = {
        code: form.code,
        description: form.description,
        maxRedemptions: form.maxRedemptions,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        enabled: form.enabled,
        rewards: {
          coins: form.coins,
          resources: {
            cpuPercent: form.cpuPercent,
            memoryMb: form.memoryMb,
            diskMb: form.diskMb,
            serverSlots: form.serverSlots,
          }
        }
      };

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts/${giftId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "update_failed");
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      const errKey = e.message || 'update_failed';
      setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : e.message);
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = form.code.trim().length > 0;

  return (
    <>
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('editGift')}
      subtitle={t('editGiftSubtitle', { code: form.code })}
      icon={<Edit2 size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            <button
              onClick={() => setShowDelete(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
            >
              {t('deleteGift')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={saving} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">{tCommon('cancel')}</button>
            <button
              onClick={handleUpdate}
              disabled={saving || loading || !isFormValid}
              className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                saving || loading || !isFormValid
                  ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                  : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
              }`}
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> {tCommon('saving')}</> : tCommon('saveChanges')}
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <AdminEditGiftSkeleton />
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Tag size={12} /> {t('codeLabel')} *</label>
              <input 
                value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={saving} placeholder={t('codePlaceholder')}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 uppercase" 
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><FileText size={12} /> {t('descriptionLabel')}</label>
              <input 
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={saving} placeholder={t('descriptionPlaceholder')}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" 
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Infinity size={12} /> {t('maxUsesLabel')}</label>
              <input type="number" min="0" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">{t('enabledLabel')}</label>
              <Select value={form.enabled ? "true" : "false"} onChange={(val) => setForm({ ...form, enabled: val === "true" })} disabled={saving} options={[{label: tCommon('yes'), value: "true"}, {label: tCommon('no'), value: "false"}]} size="md" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">{t('validFromLabel')}</label>
              <input type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#888] focus:text-white focus:outline-none focus:border-[#FF5722]/50" />
              <p className="text-[10px] text-[#555] mt-1">{t('validFromHelper')}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">{t('validUntilLabel')}</label>
              <input type="datetime-local" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#888] focus:text-white focus:outline-none focus:border-[#FF5722]/50" />
              <p className="text-[10px] text-[#555] mt-1">{t('validUntilHelper')}</p>
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t('rewardsLabel')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Coins size={12} className="text-[#666]" /> {t('coinsLabel')}</label>
                <input type="number" min="0" value={form.coins} onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Cpu size={12} className="text-[#666]" /> {t('cpuLabel')}</label>
                <input type="number" min="0" value={form.cpuPercent} onChange={(e) => setForm({ ...form, cpuPercent: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><MemoryStick size={12} className="text-[#666]" /> {t('ramLabel')}</label>
                <input type="number" min="0" value={form.memoryMb} onChange={(e) => setForm({ ...form, memoryMb: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><HardDrive size={12} className="text-[#666]" /> {t('diskLabel')}</label>
                <input type="number" min="0" value={form.diskMb} onChange={(e) => setForm({ ...form, diskMb: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2"><Server size={12} className="text-[#666]" /> {t('slotsLabel')}</label>
                <input type="number" min="0" value={form.serverSlots} onChange={(e) => setForm({ ...form, serverSlots: Number(e.target.value) })} disabled={saving} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50" />
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
    
    <AdminDeleteGiftDrawer
      isOpen={showDelete}
      onClose={() => setShowDelete(false)}
      onSuccess={() => {
        setShowDelete(false);
        onClose(); // Close edit drawer
        onSuccess(); // Refresh table
      }}
      giftId={giftId}
      giftCode={form.code}
    />
    </>
  );
}
