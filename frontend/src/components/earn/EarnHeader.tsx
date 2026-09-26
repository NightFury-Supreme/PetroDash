"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function EarnHeader() {
  const t = useTranslations("Earn");

  return (
    <header>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FF5722]">{t("title")}</h1>
          <p className="mt-1 text-sm text-white/40">
            {t("subtitle")}
          </p>
        </div>
      </div>
    </header>
  );
}
