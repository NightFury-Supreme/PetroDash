"use client";

import { useTranslations } from "next-intl";
import { useBannedStatus } from "@/hooks/auth";

export default function BannedPage() {
  const t = useTranslations("Banned");
  const { reason, untilText } = useBannedStatus();

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full max-w-xl mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3a0d0d] flex items-center justify-center">
            <i className="fas fa-ban text-red-400 text-2xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{t("title")}</h1>
        </div>
        <p className="text-[#AAAAAA] mb-4">{t("subtitle")}</p>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-[#AAAAAA]">{t("reasonLabel")}</span> <span className="font-medium">{reason}</span>
          </div>
          <div className="text-sm">
            <span className="text-[#AAAAAA]">{t("statusLabel")}</span> {untilText ? (
              <span className="font-medium"> {t("bannedUntil", { date: untilText })}</span>
            ) : (
              <span className="font-medium"> {t("lifetimeBan")}</span>
            )}
          </div>
        </div>
        <div className="mt-6 text-xs text-[#888]">{t("contactSupport")}</div>
      </div>
    </div>
  );
}
