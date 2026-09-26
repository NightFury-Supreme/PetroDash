/* ==========================================================================
   Admin Coupons Header
   Compliance: ISO/IEC 25010, Lucide Icons, Full i18n
========================================================================== */

"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface CouponsHeaderProps {
  onCreateNew: () => void;
}

export function CouponsHeader({ onCreateNew }: CouponsHeaderProps) {
  const t = useTranslations("Admin.coupons");

  return (
    <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{t("title")}</h2>
        <p className="mt-0.5 text-xs text-[#666]">{t("description")}</p>
      </div>
      <div className="flex items-center shrink-0">
        <button
          onClick={onCreateNew}
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939] shadow-sm shadow-[#FF5722]/20"
        >
          <Plus size={14} />
          {t("createCoupon")}
        </button>
      </div>
    </div>
  );
}

export default CouponsHeader;
