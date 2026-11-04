import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { Loader2, Edit2, Tag, Trash2, Ban, Power, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUpdateCoupon } from "@/hooks/admin/coupons";
import type { AdminCouponItem, UpdateCouponPayload } from "@/components/admin/coupons/types";
import { CouponPlansSelector, type PlanOption } from "./CouponPlansSelector";

interface AdminEditCouponDrawerProps {
  coupon: AdminCouponItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDeleteClick?: (coupon: AdminCouponItem) => void;
  plans: PlanOption[];
  currency?: string;
}

export function AdminEditCouponDrawer({
  coupon,
  isOpen,
  onClose,
  onSuccess,
  onDeleteClick,
  plans,
  currency = "USD",
}: AdminEditCouponDrawerProps) {
  const t = useTranslations("Admin.coupons");
  const tCommon = useTranslations("Common");

  const [form, setForm] = useState<UpdateCouponPayload>({});
  const { updateCoupon, saving, error, setError } = useUpdateCoupon(() => {
    onSuccess();
    onClose();
  });

  useEffect(() => {
    if (coupon && isOpen) {
      setForm({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : null,
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : null,
        maxRedemptions: coupon.maxRedemptions ?? 0,
        appliesToPlanIds: coupon.appliesToPlanIds || [],
        enabled: coupon.enabled,
      });
      setError(null);
    }
  }, [coupon, isOpen, setError]);

  if (!coupon) return null;

  const handleSubmit = async () => {
    if (!form.code?.trim()) return;
    await updateCoupon(coupon.id, {
      ...form,
      code: form.code.trim().toUpperCase(),
    });
  };

  const handleToggleStatus = async () => {
    const nextState = !form.enabled;
    const ok = await updateCoupon(coupon.id, { enabled: nextState });
    if (ok) {
      setForm((prev) => ({ ...prev, enabled: nextState }));
    }
  };

  const togglePlan = (planId: string) => {
    setForm((prev) => {
      const current = prev.appliesToPlanIds || [];
      const exists = current.includes(planId);
      return {
        ...prev,
        appliesToPlanIds: exists
          ? current.filter((id) => id !== planId)
          : [...current, planId],
      };
    });
  };

  const isFormValid = (form.code?.trim().length ?? 0) > 0 && (form.value ?? 0) > 0;
  const isUsed = (coupon.redeemedCount ?? 0) > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("editCoupon")}: ${coupon.code}`}
      subtitle={t("editCouponSubtitle")}
      icon={<Edit2 size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {onDeleteClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteClick(coupon);
                }}
                disabled={saving || isUsed}
                title={isUsed ? t("deleteWarning2") : undefined}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  saving || isUsed
                    ? "border-[#222] bg-[#161616] text-[#555] cursor-not-allowed"
                    : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                }`}
              >
                <Trash2 size={15} />
                <span>{t("deleteCoupon")}</span>
              </button>
            )}

            {form.enabled ? (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={saving}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  saving
                    ? "border-[#222] bg-[#161616] text-[#555] cursor-not-allowed"
                    : "border-[#222] bg-transparent text-[#888] hover:border-[#333] hover:text-[#D4D4D4] hover:bg-white/5"
                }`}
              >
                <Ban size={15} />
                <span>{t("disableCoupon")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={saving}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  saving
                    ? "border-[#222] bg-[#161616] text-[#555] cursor-not-allowed"
                    : "border-[#222] bg-transparent text-[#888] hover:border-[#333] hover:text-[#D4D4D4] hover:bg-white/5"
                }`}
              >
                <Power size={15} />
                <span>{t("enableCoupon")}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !isFormValid}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                saving || !isFormValid
                  ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                  : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
              }`}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{tCommon("saveChanges")}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t("codeLabel")} <span className="text-[#FF5722]">*</span>
            </label>
            <div className="relative">
              <input
                value={form.code || ""}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 tracking-wider transition-colors uppercase"
                placeholder={t("codePlaceholder")}
              />
              <Tag size={16} className="absolute right-3 top-3 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t("typeLabel")} <span className="text-[#FF5722]">*</span>
            </label>
            <SelectDropdown<"percentage" | "fixed">
              value={(form.type as "percentage" | "fixed") || "percentage"}
              onChange={(val) => setForm({ ...form, type: val })}
              options={[
                { label: t("percentage"), value: "percentage" },
                { label: `${t("fixed")} (${currency})`, value: "fixed" },
              ]}
              className="w-full"
              buttonClassName="h-[42px] text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-[#FF5722]/50 hover:bg-[#222]"
              menuClassName="bg-[#151515] border border-[#2A2A2A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t("valueLabel")} <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={form.type === "percentage" ? 100 : undefined}
              step="0.01"
              value={form.value ?? 0}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t("maxUsesLabel")}
            </label>
            <input
              type="number"
              min="0"
              value={form.maxRedemptions ?? 0}
              onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) || 0 })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
          </div>
        </div>

        <hr className="border-white/[0.06]" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t("validFromLabel")}
            </label>
            <input
              type="datetime-local"
              value={form.validFrom || ""}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value || null })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
            <p className="text-[11px] text-[#555] mt-1.5">{t("validFromHelper")}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t("validUntilLabel")}
            </label>
            <input
              type="datetime-local"
              value={form.validUntil || ""}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
            <p className="text-[11px] text-[#555] mt-1.5">{t("validUntilHelper")}</p>
          </div>
        </div>

        <CouponPlansSelector
          plans={plans}
          selectedPlanIds={form.appliesToPlanIds || []}
          onTogglePlan={togglePlan}
        />
      </div>
    </Drawer>
  );
}
