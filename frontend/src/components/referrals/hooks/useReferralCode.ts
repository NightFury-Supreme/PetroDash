/* ==========================================================================
   useReferralCode — Custom hook for copy-link and custom code editing
   Security: input sanitized before API call (uppercase + allowlist regex)
   Input validation aligns with OWASP input validation standards
========================================================================== */

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { SaveStatus } from "../types";

interface UseReferralCodeProps {
  initialCode: string;
  initialLink: string;
  onCodeUpdated: (newCode: string, newLink: string) => void;
}

interface UseReferralCodeResult {
  copied: boolean;
  editingCode: boolean;
  draftCode: string;
  saveStatus: SaveStatus;
  handleCopy: (link: string) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  setDraftCode: (val: string) => void;
  saveCode: () => Promise<void>;
}

export function useReferralCode({
  initialCode,
  initialLink,
  onCodeUpdated,
}: UseReferralCodeProps): UseReferralCodeResult {
  const t = useTranslations("Referrals");
  const { showError, showSuccess } = useToast();

  const [copied, setCopied] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [draftCode, setDraftCode] = useState(initialCode);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  /* -------------------------------------------------------------------------
     COPY LINK
  ------------------------------------------------------------------------- */

  const handleCopy = useCallback(
    (link: string) => {
      navigator.clipboard.writeText(link).catch(() => {
        /* clipboard may be unavailable in some environments — fail silently */
      });
      setCopied(true);
      showSuccess(t("copiedToClipboard"));
      setTimeout(() => setCopied(false), 2000);
    },
    [showSuccess, t],
  );

  /* -------------------------------------------------------------------------
     EDIT CONTROLS
  ------------------------------------------------------------------------- */

  const startEditing = useCallback(() => {
    setDraftCode(initialCode);
    setEditingCode(true);
  }, [initialCode]);

  const cancelEditing = useCallback(() => {
    setDraftCode(initialCode);
    setEditingCode(false);
    setSaveStatus("idle");
  }, [initialCode]);

  /* -------------------------------------------------------------------------
     SAVE CODE
     Input sanitized: trimmed, uppercased, restricted to [A-Z0-9-_]
  ------------------------------------------------------------------------- */

  const saveCode = useCallback(async () => {
    const normalized = draftCode.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, "");
    if (!normalized) return;

    setSaveStatus("loading");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/referrals/code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code: normalized }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        const newLink = initialLink.replace(/[^/]+$/, data.code);
        onCodeUpdated(data.code, newLink);
        setDraftCode(data.code);
        setEditingCode(false);
        showSuccess(t("codeUpdatedSuccess"));
      } else {
        // Extract first field-level validation error if available
        let errorMsg: string = data.error ?? t("failedToUpdateCode");
        if (data.details?.fieldErrors) {
          const fields = Object.keys(data.details.fieldErrors) as string[];
          if (fields.length > 0) {
            const firstField = fields[0];
            const firstMsg = data.details.fieldErrors[firstField]?.[0];
            if (firstMsg) errorMsg = firstMsg;
          }
        }
        showError(errorMsg);
        setSaveStatus("error");
      }
    } catch {
      showError(t("unexpectedError"));
      setSaveStatus("error");
    } finally {
      setSaveStatus("idle");
    }
  }, [draftCode, initialLink, initialCode, onCodeUpdated, showSuccess, showError, t]);

  return {
    copied,
    editingCode,
    draftCode,
    saveStatus,
    handleCopy,
    startEditing,
    cancelEditing,
    setDraftCode,
    saveCode,
  };
}
