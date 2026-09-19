/* ==========================================================================
   CustomReferralCode — Section for viewing/editing the custom referral code
   Locked/unlocked states clearly communicated via ARIA and visual cues
   WCAG 2.2: disabled button with aria-label, logical tab order
========================================================================== */

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Pencil, Lock } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import type { SaveStatus } from "../../types";

interface CustomReferralCodeProps {
  readonly unlocked: boolean;
  readonly threshold: number;
  readonly editingCode: boolean;
  readonly draftCode: string;
  readonly saveStatus: SaveStatus;
  readonly onStartEditing: () => void;
  readonly onCancelEditing: () => void;
  readonly onChangeDraftCode: (val: string) => void;
  readonly onSaveCode: () => void;
}

export function CustomReferralCode({
  unlocked,
  threshold,
  editingCode,
  draftCode,
  saveStatus,
  onStartEditing,
  onCancelEditing,
  onChangeDraftCode,
  onSaveCode,
}: CustomReferralCodeProps) {
  const t = useTranslations("Referrals");

  return (
    <section
      aria-label={t("customCode")}
      className="border-t border-white/[0.07] pt-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Info */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              unlocked ? "bg-orange-500/[0.07]" : "bg-white/[0.04]"
            }`}
            aria-hidden="true"
          >
            {unlocked ? (
              <Pencil size={16} className="text-orange-400" />
            ) : (
              <Lock size={16} className="text-white/25" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{t("customCode")}</h2>
              {unlocked && (
                <span className="rounded-full bg-orange-500/[0.08] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-orange-400">
                  {t("unlocked")}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-white/30">
              {unlocked
                ? t("unlockedDescription", { threshold })
                : t("lockedDescription", { threshold })}
            </p>
          </div>
        </div>

        {/* Edit button */}
        <button
          type="button"
          disabled={!unlocked}
          onClick={onStartEditing}
          aria-label={unlocked ? t("editCode") : t("locked")}
          aria-disabled={!unlocked}
          className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 ${
            unlocked
              ? "border-[#2A2A2A] bg-[#1A1A1A] text-[#888] hover:border-[#FF5722]/30 hover:bg-[#FF5722]/[0.06] hover:text-[#FF5722]"
              : "cursor-not-allowed border-white/[0.06] text-white/20 bg-transparent"
          }`}
        >
          {unlocked ? (
            <>
              <Pencil size={13} aria-hidden="true" />
              {t("editCode")}
            </>
          ) : (
            <>
              <Lock size={13} aria-hidden="true" />
              {t("locked")}
            </>
          )}
        </button>
      </div>

      {/* Inline editor — only shown when unlocked and editing */}
      {editingCode && unlocked && (
        <CodeEditor
          draftCode={draftCode}
          saveStatus={saveStatus}
          onChangeDraftCode={onChangeDraftCode}
          onCancel={onCancelEditing}
          onSave={onSaveCode}
        />
      )}
    </section>
  );
}
