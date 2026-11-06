"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import {
  type UserProfileData,
  getCachedUserSync,
  fetchCurrentUser,
  subscribeUser,
  invalidateUserCache,
} from "@/utils/userCache";
import {
  type BrandingInfo,
  getCachedBrandingSync,
  fetchBrandingData,
  subscribeBranding,
} from "@/utils/configCache";

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
  emailVerified?: boolean;
}

export interface SidebarBrand {
  name: string;
  icon: string;
  earnEnabled: boolean;
}

function mapToSidebarUser(u: UserProfileData | null): SidebarUser | null {
  if (!u) return null;
  return {
    username: u.username,
    email: u.email,
    role: u.role,
    coins: u.coins,
    hasActivePlans: Boolean(u.hasActivePlans),
    profilePicture: u.profilePicture,
    firstName: u.firstName,
    lastName: u.lastName,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username,
    emailVerified: Boolean(u.emailVerified),
  };
}

function mapToSidebarBrand(b: BrandingInfo): SidebarBrand {
  return {
    name: b.siteName || "PteroDash",
    icon: b.siteIcon || "",
    earnEnabled: Boolean(b.earnEnabled),
  };
}

export function useSidebarUser() {
  const [user, setUser] = useState<SidebarUser | null>(() =>
    mapToSidebarUser(getCachedUserSync())
  );
  const [loading, setLoading] = useState<boolean>(!user);
  const [brand, setBrand] = useState<SidebarBrand>(() =>
    mapToSidebarBrand(getCachedBrandingSync())
  );

  const refreshUser = useCallback(async (force = false) => {
    try {
      const data = await fetchCurrentUser({ force });
      setUser(mapToSidebarUser(data));
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
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      invalidateUserCache();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubUser = subscribeUser((u) => {
      setUser(mapToSidebarUser(u));
      setLoading(false);
    });

    const unsubBrand = subscribeBranding((b) => {
      setBrand(mapToSidebarBrand(b));
    });

    refreshUser();
    fetchBrandingData().then((b) => setBrand(mapToSidebarBrand(b)));

    const handleFocus = () => {
      refreshUser(false);
    };

    const handleUserRefresh = () => {
      refreshUser(true);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("user:refresh", handleUserRefresh);
    return () => {
      unsubUser();
      unsubBrand();
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("user:refresh", handleUserRefresh);
    };
  }, [refreshUser]);

  return { user, loading, brand, refreshUser, logout };
}
