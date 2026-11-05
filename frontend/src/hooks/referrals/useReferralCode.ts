"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { clearReferralStatsCache } from "./useReferralStats";
import type { SaveStatus } from "./types";

export interface UseReferralCodeProps {
  initialCode: string;
  initialLink: string;
  onCodeUpdated: (newCode: string, newLink: string) => void;
}

export interface UseReferralCodeResult {
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
  const tError = useTranslations("BackendErrors");
  const { showError, showSuccess } = useToast();

  const [copied, setCopied] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [draftCode, setDraftCode] = useState(initialCode);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editingCode) {
      setDraftCode(initialCode);
    }
  }, [initialCode, editingCode]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const triggerCopiedState = useCallback(() => {
    setCopied(true);
    showSuccess(t("copiedToClipboard"));
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [showSuccess, t]);

  const fallbackCopy = useCallback((text: string) => {
    try {
      if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) {
          triggerCopiedState();
          return;
        }
      }
      showError(t("unexpectedError"));
    } catch {
      showError(t("unexpectedError"));
    }
  }, [triggerCopiedState, showError, t]);

  const handleCopy = useCallback(
    (link: string) => {
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(link).then(() => {
          triggerCopiedState();
        }).catch(() => {
          fallbackCopy(link);
        });
        return;
      }
      fallbackCopy(link);
    },
    [triggerCopiedState, fallbackCopy]
  );

  const startEditing = useCallback(() => {
    setDraftCode(initialCode);
    setEditingCode(true);
  }, [initialCode]);

  const cancelEditing = useCallback(() => {
    setDraftCode(initialCode);
    setEditingCode(false);
    setSaveStatus("idle");
  }, [initialCode]);

  const saveCode = useCallback(async () => {
    const normalized = draftCode.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, "");
    if (!normalized || normalized.length < 3) return;

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
        }
      );

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        error?: { code?: string; message?: string; details?: { fieldErrors?: Record<string, string[]> } } | string;
        message?: string;
      };

      if (res.ok && data.code) {
        clearReferralStatsCache();
        const newLink = initialLink.replace(/[^/]+$/, data.code);
        onCodeUpdated(data.code, newLink);
        setDraftCode(data.code);
        setEditingCode(false);
        showSuccess(t("codeUpdatedSuccess"));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("user:refresh"));
          window.dispatchEvent(new Event("referrals:refresh"));
        }
      } else {
        const errObj = typeof data.error === "object" ? data.error : null;
        const msgStr = typeof data.message === "string" ? data.message : null;
        const errStr = typeof data.error === "string" ? data.error : null;
        const code =
          msgStr && msgStr.startsWith("ERR_")
            ? msgStr
            : errObj?.code || (errStr && errStr.startsWith("ERR_") ? errStr : null) || msgStr || errStr;

        let errorMsg = code && tError.has(code)
          ? tError(code)
          : code && t.has(code as Parameters<typeof t>[0])
          ? t(code as Parameters<typeof t>[0])
          : t("failedToUpdateCode");

        if (code === "ERR_INVALID_PAYLOAD" && errObj?.details?.fieldErrors) {
          const fields = Object.keys(errObj.details.fieldErrors);
          if (fields.length > 0) {
            const firstMsg = errObj.details.fieldErrors[fields[0]]?.[0];
            if (firstMsg) errorMsg = firstMsg;
          }
        }

        showError(errorMsg);
        setSaveStatus("error");
      }
    } catch {
      showError(tError.has("ERR_INTERNAL_SERVER") ? tError("ERR_INTERNAL_SERVER") : t("unexpectedError"));
      setSaveStatus("error");
    } finally {
      setSaveStatus("idle");
    }
  }, [draftCode, initialLink, onCodeUpdated, showSuccess, showError, t, tError]);

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
