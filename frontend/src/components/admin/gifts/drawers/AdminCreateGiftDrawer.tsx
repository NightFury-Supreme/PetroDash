/* ==========================================================================
   Admin Create Gift Drawer
   Compliance: ISO/IEC 25010, SoC (Uses useCreateAdminGift hook)
========================================================================== */

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Select } from "@/components/ui/Select";
import { Loader2, Plus, Coins, Cpu, MemoryStick, HardDrive, Server, Tag, FileText, Infinity } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateAdminGift, type CreateGiftPayload } from "@/hooks/admin/gift";

interface AdminCreateGiftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialForm: CreateGiftPayload = {
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
};

export function AdminCreateGiftDrawer({
  isOpen,
  onClose,
  onSuccess,
}: AdminCreateGiftDrawerProps) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');

  const [form, setForm] = useState<CreateGiftPayload>(initialForm);
  const { createGift, saving, error, setError } = useCreateAdminGift(() => {
    onSuccess();
    onClose();
  });

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setError(null);
    }
  }, [isOpen, setError]);

  const handleSubmit = async () => {
    if (!form.code.trim()) return;
    await createGift(form);
  };

  const isFormValid = form.code.trim().length > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('createGift')}
      subtitle={t('createGiftSubtitle')}
      icon={<Plus size={20} />}
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isFormValid}
            className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              saving || !isFormValid
                ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {tCommon('creating')}
              </>
            ) : (
              t('createGift')
            )}
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
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              <Tag size={12} /> {t('codeLabel')} *
            </label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={saving}
              placeholder={t('codePlaceholder')}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 uppercase"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              <FileText size={12} /> {t('descriptionLabel')}
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={saving}
              placeholder={t('descriptionPlaceholder')}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              <Infinity size={12} /> {t('maxUsesLabel')}
            </label>
            <input
              type="number"
              min="0"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) })}
              disabled={saving}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t('enabledLabel')}
            </label>
            <Select
              value={form.enabled ? "true" : "false"}
              onChange={(val) => setForm({ ...form, enabled: val === "true" })}
              disabled={saving}
              options={[
                { label: tCommon('yes'), value: "true" },
                { label: tCommon('no'), value: "false" },
              ]}
              size="md"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t('validFromLabel')}
            </label>
            <input
              type="datetime-local"
              value={form.validFrom || ""}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              disabled={saving}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#888] focus:text-white focus:outline-none focus:border-[#FF5722]/50"
            />
            <p className="text-[10px] text-[#555] mt-1">{t('validFromHelper')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t('validUntilLabel')}
            </label>
            <input
              type="datetime-local"
              value={form.validUntil || ""}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              disabled={saving}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#888] focus:text-white focus:outline-none focus:border-[#FF5722]/50"
            />
            <p className="text-[10px] text-[#555] mt-1">{t('validUntilHelper')}</p>
          </div>
        </div>

        <hr className="border-white/[0.06]" />

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">{t('rewardsLabel')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
                <Coins size={12} className="text-[#666]" /> {t('coinsLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={form.coins}
                onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })}
                disabled={saving}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
                <Cpu size={12} className="text-[#666]" /> {t('cpuLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={form.cpuPercent}
                onChange={(e) => setForm({ ...form, cpuPercent: Number(e.target.value) })}
                disabled={saving}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
                <MemoryStick size={12} className="text-[#666]" /> {t('ramLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={form.memoryMb}
                onChange={(e) => setForm({ ...form, memoryMb: Number(e.target.value) })}
                disabled={saving}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
                <HardDrive size={12} className="text-[#666]" /> {t('diskLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={form.diskMb}
                onChange={(e) => setForm({ ...form, diskMb: Number(e.target.value) })}
                disabled={saving}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
                <Server size={12} className="text-[#666]" /> {t('slotsLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={form.serverSlots}
                onChange={(e) => setForm({ ...form, serverSlots: Number(e.target.value) })}
                disabled={saving}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50"
              />
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
