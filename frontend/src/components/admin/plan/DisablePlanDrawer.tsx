"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";

interface DisablePlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  planName: string;
  planDescription?: string;
}

export function DisablePlanDrawer({
  isOpen,
  onClose,
  onConfirm,
  planName,
  planDescription,
}: DisablePlanDrawerProps) {
  const [isDisabling, setIsDisabling] = useState(false);
  const { showError } = useToast();
  const t = useTranslations("Admin.plan");
  const tCommon = useTranslations("Common");

  useEffect(() => {
    if (isOpen) {
      setIsDisabling(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsDisabling(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "";
      showError(errMsg || tCommon("error"));
      setIsDisabling(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("disablePlanTitle")}
      subtitle={t("disablePlanSubtitle")}
      footer={
        <div className="flex items-center justify-end w-full">

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDisabling}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              isDisabling
                ? "bg-[#111] text-[#555] cursor-not-allowed"
                : "bg-amber-500 text-black hover:bg-amber-400 shadow-sm"
            }`}
          >
            {isDisabling && <Loader2 size={15} className="animate-spin" />}
            <span>{t("disablePlan")}</span>
          </button>
        </div>
      }
    >
      <div className="border-b border-white/[0.07] pb-6 mb-8 mt-2">
        <h2 className="text-[16px] font-semibold text-zinc-200 truncate leading-snug">
          {planName}
        </h2>
        {planDescription && (
          <p className="mt-0.5 text-[11px] font-medium text-[#888] truncate">
            {planDescription}
          </p>
        )}
      </div>

      <div className="border-l-2 border-amber-500 pl-4 py-1 mb-6">
        <ul className="space-y-2">
          <li className="flex items-start gap-2.5 text-xs text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
            <span>{t("disableWarning1")}</span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
            <span>{t("disableWarning2")}</span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
            <span>{t("disableWarning3")}</span>
          </li>
        </ul>
      </div>
    </Drawer>
  );
}

export default DisablePlanDrawer;
