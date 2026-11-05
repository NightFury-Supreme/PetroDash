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
  const tCommon = useTranslations("Common");

  if (!coupons?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Tag size={36} className="text-white/30 mb-4" strokeWidth={1.5} />
        <p className="text-sm font-medium text-white/70">{t("noCouponsFound")}</p>
        <p className="text-xs text-white/40 mt-1 max-w-sm">{t("noCouponsFoundDesc")}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_100px_60px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
        <span>{t("couponCode")}</span>
        <span>{t("value")}</span>
        <span>{t("uses")}</span>
        <span>{t("validity")}</span>
        <span>{tCommon("status")}</span>
        <span className="text-right">{tCommon("action")}</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {coupons.map((coupon) => (
          <AdminCouponItemRow
            key={coupon.id}
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
