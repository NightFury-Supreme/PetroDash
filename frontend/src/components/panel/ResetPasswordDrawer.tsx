"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import type { ResetPasswordDrawerProps } from "./types";

export function ResetPasswordDrawer({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  username,
  email,
}: ResetPasswordDrawerProps) {
  const t = useTranslations("Panel");

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("resetPanelPasswordTitle")}
      subtitle={t("resetPanelPasswordSubtitle")}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("resetting")}
              </>
            ) : (
              <>
                <RefreshCw size={15} />
                {t("resetPasswordConfirm")}
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {(username || email) && (
          <div className="border-b border-white/[0.07] pb-5">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-zinc-200 truncate leading-snug">
                {username || t("noEmailLinked")}
              </h2>
              {email && (
                <p className="mt-0.5 text-xs text-[#888] truncate">{email}</p>
              )}
            </div>
          </div>
        )}

        <div className="border-l-2 border-[#FF5722] pl-4 py-1">
          <div className="flex items-center gap-2 text-[#FF5722] mb-3">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("resetWarningTitle")}
            </span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#FF5722]" />
              <span>{t("resetWarningPoint1")}</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#FF5722]" />
              <span>{t("resetWarningPoint2")}</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#FF5722]" />
              <span>{t("resetWarningPoint3")}</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          {t("resetPanelPasswordBody")}
        </p>
      </div>
    </Drawer>
  );
}
