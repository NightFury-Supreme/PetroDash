import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { Loader2, Plus, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateCoupon } from "@/hooks/admin/coupons";
import type { CreateCouponPayload } from "@/components/admin/coupons/types";
import { CouponPlansSelector, type PlanOption } from "./CouponPlansSelector";

interface AdminCreateCouponDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plans: PlanOption[];
  currency?: string;
}

const initialForm: CreateCouponPayload = {
  code: "",
  type: "percentage",
  value: 10,
  maxRedemptions: 0,
  validFrom: null,
  validUntil: null,
  appliesToPlanIds: [],
  enabled: true,
};

export function AdminCreateCouponDrawer({
  isOpen,
  onClose,
  onSuccess,
  plans,
  currency = "USD",
}: AdminCreateCouponDrawerProps) {
  const t = useTranslations("Admin.coupons");
  const tCommon = useTranslations("Common");

  const [form, setForm] = useState<CreateCouponPayload>(initialForm);
  const { createCoupon, saving, error, setError } = useCreateCoupon(() => {
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
    await createCoupon({
      ...form,
      code: form.code.trim().toUpperCase(),
    });
  };

  const togglePlan = (planId: string) => {
    setForm((prev) => {
      const exists = prev.appliesToPlanIds.includes(planId);
      return {
        ...prev,
        appliesToPlanIds: exists
          ? prev.appliesToPlanIds.filter((id) => id !== planId)
          : [...prev.appliesToPlanIds, planId],
      };
    });
  };

  const isFormValid = form.code.trim().length > 0 && form.value > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("createCoupon")}
      subtitle={t("createCouponSubtitle")}
      icon={<Plus size={20} />}
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !isFormValid}
            className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${saving || !isFormValid
              ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
              : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
              }`}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {tCommon("creating")}
              </>
            ) : (
              t("createCoupon")
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">
              {t("codeLabel")} <span className="text-[#FF5722]">*</span>
            </label>
            <div className="relative">
              <input
                value={form.code}
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
              value={form.type}
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
              value={form.value}
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
              value={form.maxRedemptions}
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
          selectedPlanIds={form.appliesToPlanIds}
          onTogglePlan={togglePlan}
        />
      </div>
    </Drawer>
  );
}
