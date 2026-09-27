"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface SidebarUser {
  username?: string;
  email?: string;
  role?: string;
  coins?: number;
  hasActivePlans?: boolean;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export interface SidebarBrand {
  name: string;
  icon: string;
  earnEnabled: boolean;
}

export function useSidebarUser() {
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<SidebarBrand>({
    name: "PetroDash",
    icon: "",
    earnEnabled: false,
  });

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = (await r.json().catch(() => ({}))) as SidebarUser;
      if (!r.ok) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const plansResponse = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/user/plans`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (plansResponse.ok) {
          const plans = (await plansResponse.json().catch(() => [])) as unknown[];
          d.hasActivePlans = Array.isArray(plans) && plans.length > 0;
        } else {
          d.hasActivePlans = false;
        }
      } catch {
        d.hasActivePlans = false;
      }

      setUser(d);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (token) {
        await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Logout best-effort
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/branding`)
      .then((r) => r.json())
      .then((s) => {
        setBrand({
          name: s?.siteName || "PetroDash",
          icon: s?.siteIcon || "",
          earnEnabled: Boolean(s?.earnEnabled),
        });
      })
      .catch(() => {
        setBrand({ name: "PetroDash", icon: "", earnEnabled: false });
      });

    const handleCoinsUpdate = (e: CustomEvent<{ coins: number }>) => {
      if (typeof e.detail?.coins === "number") {
        setUser((prev) => (prev ? { ...prev, coins: e.detail.coins } : prev));
      }
    };

    const handleRefresh = () => {
      refreshUser();
    };

    window.addEventListener("coins:update", handleCoinsUpdate as EventListener);
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("user:refresh", handleRefresh);
    return () => {
      window.removeEventListener("coins:update", handleCoinsUpdate as EventListener);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("user:refresh", handleRefresh);
    };
  }, [refreshUser]);

  return { user, loading, brand, refreshUser, logout };
}
