"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import type { PanelData, UsePanelReturn, ApiErrorResponse } from "./types";

let memoryCache: PanelData | null = null;
let inFlightPanelPromise: Promise<PanelData | null> | null = null;

export function clearPanelCache(): void {
  memoryCache = null;
}

export function setPanelCache(data: PanelData): void {
  memoryCache = data;
}

export function usePanel(): UsePanelReturn {
  const tError = useTranslations("GlobalErrors");
  const [panelData, setPanelData] = useState<PanelData | null>(() => memoryCache);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !memoryCache);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(Boolean(memoryCache));
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPanelData = useCallback(
    async (options?: { force?: boolean }) => {
      if (options?.force) {
        clearPanelCache();
      }

      if (memoryCache && !options?.force) {
        setPanelData(memoryCache);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      if (inFlightPanelPromise && !options?.force) {
        try {
          const cachedResult = await inFlightPanelPromise;
          if (isMountedRef.current && cachedResult) {
            setPanelData(cachedResult);
            setError(null);
          }
        } catch (err: unknown) {
          if (isMountedRef.current) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || tError("failedToLoadPanelInformation"));
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
        return;
      }

      inFlightPanelPromise = (async (): Promise<PanelData | null> => {
        const response = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/panel`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
          0
        );

        if (!response.ok) {
          let errorData: ApiErrorResponse = {};
          try {
            errorData = (await response.json()) as ApiErrorResponse;
          } catch {}
          const code = (typeof errorData?.error === "object" ? errorData?.error?.code : errorData?.error) || errorData?.code;
          const msg = (typeof errorData?.error === "object" ? errorData?.error?.message : undefined) || errorData?.message;
          throw new Error(code || msg || tError("failedToLoadPanelInformation"));
        }

        const data = (await response.json()) as PanelData;
        memoryCache = data;
        return data;
      })();

      try {
        const result = await inFlightPanelPromise;
        if (isMountedRef.current && result) {
          setPanelData(result);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message || tError("failedToLoadPanelInformation"));
        }
      } finally {
        inFlightPanelPromise = null;
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [tError]
  );

  const resetPassword = useCallback(async () => {
    if (resetting) return;
    try {
      setResetting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        throw new Error(tError("authenticationRequired"));
      }

      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/panel/reset`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
        0
      );

      if (!response.ok) {
        let errorData: ApiErrorResponse = {};
        try {
          errorData = (await response.json()) as ApiErrorResponse;
        } catch {}
        const code = (typeof errorData?.error === "object" ? errorData?.error?.code : errorData?.error) || errorData?.code;
        const msg = (typeof errorData?.error === "object" ? errorData?.error?.message : undefined) || errorData?.message;
        throw new Error(code || msg || tError("failedToResetPassword"));
      }

      const data = (await response.json()) as { password?: string };
      if (data.password && isMountedRef.current) {
        setPassword(data.password);
      }
      return data.password;
    } finally {
      if (isMountedRef.current) {
        setResetting(false);
      }
    }
  }, [resetting, tError]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchPanelData();
    }
  }, [fetchPanelData]);

  return {
    panelData,
    password,
    loading,
    error,
    resetting,
    fetchPanelData,
    resetPassword,
  };
}
