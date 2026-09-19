/* ==========================================================================
   CodeEditor — Inline editor for customizing a referral code
   Input validation: allowlist regex enforced on every keystroke + on save
   WCAG 2.2: labels, focus management (autoFocus), keyboard support
========================================================================== */

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { X, Save, Loader2 } from "lucide-react";
import type { SaveStatus } from "../../types";

interface CodeEditorProps {
  readonly draftCode: string;
  readonly saveStatus: SaveStatus;
  readonly onChangeDraftCode: (val: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

export function CodeEditor({
  draftCode,
  saveStatus,
  onChangeDraftCode,
  onCancel,
  onSave,
}: CodeEditorProps) {
  const t = useTranslations("Referrals");
  const tCommon = useTranslations('Common');
  const isSaving = saveStatus === "loading";

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, "");
    onChangeDraftCode(sanitized);
  }

  return (
    <div className="mt-5 rounded-lg border border-[#222] bg-[#161616] p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Input */}
        <div className="flex flex-1 items-center overflow-hidden rounded-md border border-white/[0.08] bg-[#101010]">
          <span
            className="border-r border-white/[0.06] px-3 text-xs text-white/20 shrink-0"
            aria-hidden="true"
          >
            {t("codeLabel")}
          </span>
          <input
            type="text"
            value={draftCode}
            onChange={handleInputChange}
            maxLength={20}
            minLength={3}
            autoFocus
            aria-label={t("codeLabel")}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium tracking-wider text-white outline-none placeholder:text-white/15 focus-visible:ring-0"
            placeholder={t("codePlaceholder")}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex h-10 items-center gap-2 rounded-md border border-white/[0.07] px-4 text-xs text-white/40 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <X size={13} aria-hidden="true" />
            {tCommon('cancel')}
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || draftCode.replace(/[^A-Z0-9-_]/g, "").length < 3}
            className="flex h-10 items-center gap-2 rounded-md px-4 text-xs font-medium text-white transition-all disabled:opacity-50 disabled:bg-[#161616] disabled:text-[#888] disabled:border disabled:border-[#222] bg-[#FF5722] hover:bg-[#E64D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
          >
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                {tCommon('saving')}
              </>
            ) : (
              <>
                <Save size={13} aria-hidden="true" />
                {t("saveCode")}
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-white/20">{t("linkAutoUpdates")}</p>
    </div>
  );
}
