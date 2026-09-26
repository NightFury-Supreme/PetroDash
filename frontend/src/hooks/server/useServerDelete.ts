"use client";

import { useState, useCallback } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";

interface DeleteErrorPayload {
  error?: string | { code?: string; message?: string };
  code?: string;
  message?: string;
}

export function useServerDelete(onDeleted?: (serverId: string) => void) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();
  const t = useTranslations("Dashboard");
  const tErrorBackend = useTranslations("BackendErrors");

  const deleteServer = useCallback(
    async (serverId: string, serverName: string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showError(t("authRequired"));
        return false;
      }

      setDeletingId(serverId);
      try {
        const response = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/servers/${serverId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          let errorData: DeleteErrorPayload = {};
          try {
            errorData = await response.json();
          } catch {}

          const code =
            typeof errorData.error === "object"
              ? errorData.error?.code
              : errorData.code || (typeof errorData.error === "string" ? errorData.error : null);
          const msg =
            typeof errorData.error === "object"
              ? errorData.error?.message
              : errorData.message || (typeof errorData.error === "string" ? errorData.error : null);

          throw new Error(code || msg || "ERR_SERVER_DELETE_FAILED");
        }

        if (onDeleted) onDeleted(serverId);
        showSuccess(t("deleteServerSuccess", { name: serverName }));
        return true;
      } catch (e: unknown) {
        const errKey = e instanceof Error ? e.message : "ERR_INTERNAL_SERVER";
        let displayMsg: string;
        try {
          displayMsg = tErrorBackend(errKey as never);
        } catch {
          if (errKey === "authRequired") {
            displayMsg = t("authRequired");
          } else {
            displayMsg = tErrorBackend("ERR_INTERNAL_SERVER");
          }
        }
        showError(displayMsg);
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [onDeleted, showError, showSuccess, t, tErrorBackend]
  );

  return {
    deleteServer,
    deletingId,
  };
}
