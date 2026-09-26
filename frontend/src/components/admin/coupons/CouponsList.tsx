/* ==========================================================================
   Admin Coupons List
   Compliance: ISO/IEC 25010, Strong Typing, Full i18n
========================================================================== */

"use client";

import React from "react";
import { Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminCouponItemRow } from "./AdminCouponItemRow";
import type { AdminCouponItem } from "./types";

interface CouponsListProps {
  coupons: AdminCouponItem[];
  currency?: string;
  onManage: (coupon: AdminCouponItem) => void;
  onDeleteClick?: (coupon: AdminCouponItem) => void;
}

export function CouponsList({
  coupons,
  currency = "USD",
  onManage,
  onDeleteClick,
}: CouponsListProps) {
  const t = useTranslations("Admin.coupons");

  if (!coupons?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-white/[0.06] rounded-2xl bg-white/[0.01]">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30 mb-4">
          <Tag size={24} />
        </div>
        <p className="text-sm font-medium text-white/70">{t("noCouponsFound")}</p>
        <p className="text-xs text-white/40 mt-1 max-w-sm">{t("noCouponsFoundDesc")}</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden">
      {/* Column headers */}
      <div className="hidden gap-4 grid-cols-[2fr_1.2fr_1fr_1.2fr_100px_80px] border-b border-white/[0.06] px-5 py-3.5 text-[9px] uppercase tracking-[0.14em] font-semibold text-white/40 md:grid bg-white/[0.02]">
        <span>{t("couponCode")}</span>
        <span>{t("value")}</span>
        <span>{t("uses")}</span>
        <span>{t("validity")}</span>
        <span>{t("statusEnabled")} / {t("statusDisabled")}</span>
        <span className="text-right">{t("actions")}</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {coupons.map((coupon) => (
          <AdminCouponItemRow
            key={coupon._id}
            coupon={coupon}
            currency={currency}
            onManage={onManage}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </div>
    </div>
  );
}

export default CouponsList;
