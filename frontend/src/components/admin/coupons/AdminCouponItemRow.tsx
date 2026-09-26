/* ==========================================================================
   Admin Coupon Item Row
   Compliance: ISO/IEC 25010, Strong Typing, Full i18n
========================================================================== */

"use client";

import React from "react";
import { Edit2, Tag, Trash2 } from "lucide-react";
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
  onDeleteClick,
}: AdminCouponItemRowProps) {
  const t = useTranslations("Admin.coupons");
  const tCommon = useTranslations("Common");

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return tCommon("noLimit");
    return new Date(dateStr).toLocaleDateString();
  };

  const isExpired = coupon.validUntil && new Date(coupon.validUntil).getTime() < Date.now();
  const isUsed = (coupon.redeemedCount ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1.2fr_1fr_1.2fr_100px_80px] md:items-center">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-white/50">
          <Tag size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/90 truncate font-mono tracking-wide">
            {coupon.code}
          </p>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-white/90">
          {coupon.type === "percentage" ? `${coupon.value}%` : `${coupon.value} ${currency}`}
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
          {coupon.type === "percentage" ? t("off") : t("discount")}
        </span>
      </div>

      {/* Uses */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-white/90">{coupon.redeemedCount ?? 0}</span>
        <span className="text-xs text-white/40 uppercase tracking-wide">
          / {coupon.maxRedemptions || "∞"}
        </span>
      </div>

      {/* Validity */}
      <div className="flex flex-col justify-center">
        <span className="text-xs font-semibold text-white/80">{formatDate(coupon.validUntil)}</span>
        <span className="text-[9px] text-white/30 uppercase tracking-wider font-medium">
          {t("validity")}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center">
        {isExpired ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium tracking-wide uppercase border border-amber-500/20">
            {t("statusExpired")}
          </span>
        ) : coupon.enabled ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">
            {t("statusEnabled")}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">
            {t("statusDisabled")}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => onManage(coupon)}
          className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          title={tCommon("manage")}
          type="button"
        >
          <Edit2 size={13} />
        </button>

        {onDeleteClick && (
          <button
            onClick={() => onDeleteClick(coupon)}
            disabled={isUsed}
            className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={isUsed ? t("deleteWarning2") : tCommon("delete")}
            type="button"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
