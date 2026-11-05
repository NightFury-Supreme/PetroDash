"use client";

import React from "react";
import { Settings } from "lucide-react";
import { RowActionButton, StatusIndicator } from "@/components/ui";
import { useTranslations } from "next-intl";
import type { AdminCouponItem } from "./types";

interface AdminCouponItemRowProps {
  coupon: AdminCouponItem;
  currency?: string;
  onManage: (coupon: AdminCouponItem) => void;
  onDeleteClick?: (coupon: AdminCouponItem) => void;
}

export function AdminCouponItemRow({
  coupon,
  currency = "USD",
  onManage,
}: AdminCouponItemRowProps) {
  const t = useTranslations("Admin.coupons");
  const tCommon = useTranslations("Common");

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return tCommon("noLimit");
    return new Date(dateStr).toLocaleDateString();
  };

  const isExpired = coupon.validUntil && new Date(coupon.validUntil).getTime() < Date.now();

  return (
    <div className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_100px_60px] md:items-center">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/90 truncate tracking-wide">
          {coupon.code}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-sm font-normal text-white/90">
          {coupon.type === "percentage" ? `${coupon.value}%` : `${coupon.value} ${currency}`}
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
          {coupon.type === "percentage" ? t("off") : t("discount")}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-sm font-normal text-white/90">{coupon.redeemedCount ?? 0}</span>
        <span className="text-xs text-white/40 uppercase tracking-wide">
          / {coupon.maxRedemptions || "∞"}
        </span>
      </div>

      <div className="flex flex-col justify-center gap-1">
        <span className="text-xs font-normal text-white/80">{formatDate(coupon.validUntil)}</span>
        <span className="text-[9px] text-white/30 uppercase tracking-wider font-medium mt-0.5">
          {t("validity")}
        </span>
      </div>

      <div className="flex items-center mt-2 md:mt-0">
        <StatusIndicator
          status={isExpired ? "expired" : coupon.enabled ? "enabled" : "disabled"}
          label={isExpired ? t("statusExpired") : coupon.enabled ? t("statusEnabled") : t("statusDisabled")}
          size="sm"
          className="uppercase tracking-wide"
        />
      </div>

      <div className="flex items-center justify-end mt-2 md:mt-0">
        <RowActionButton
          variant="default"
          onClick={() => onManage(coupon)}
          title={tCommon("manage")}
        >
          <Settings size={15} />
        </RowActionButton>
      </div>
    </div>
  );
}

export default AdminCouponItemRow;
