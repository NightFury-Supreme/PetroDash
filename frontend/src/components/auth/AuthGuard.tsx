"use client";

import { useEffect, useMemo, useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS: readonly string[] = [
  "/login",
  "/register",
  "/auth/callback",
  "/banned",
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const isPublic = useMemo(() => {
    // Allow direct access to banned page only when ban context present
    if (pathname.startsWith("/banned")) {
      try { return Boolean(sessionStorage.getItem("ban_reason")); } catch { return false; }
    }
    if (pathname === "/") return false; // treat home as protected (dashboard)
    return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  }, [pathname]);

  useLayoutEffect(() => {
    if (isPublic) return;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) {
          router.replace("/login");
          return;
        }
        // Validate token and check ban state
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (res.status === 403) {
          try {
            const d = await res.json();
            if (typeof window !== "undefined") {
              if (d?.reason) sessionStorage.setItem("ban_reason", d.reason);
              if (d?.until) sessionStorage.setItem("ban_until", String(d.until)); else sessionStorage.removeItem("ban_until");
            }
          } catch {}
          if (!pathname.startsWith("/banned")) router.replace("/banned");
          return;
        }
        if (!res.ok) {
          // Invalid token or other error -> login
          router.replace("/login");
          return;
        }
        // Auth OK and not banned, clear any stale ban markers
        try {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("ban_reason");
            sessionStorage.removeItem("ban_until");
          }
        } catch {}
      } catch {
        router.replace("/login");
      }
    })();
  }, [isPublic, router, pathname]);

  // If trying to access /banned directly with no ban context: block
  useLayoutEffect(() => {
    if (!pathname.startsWith("/banned")) return;
    try {
      const hasBan = typeof window !== "undefined" ? Boolean(sessionStorage.getItem("ban_reason")) : false;
      if (!hasBan) {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        router.replace(token ? "/" : "/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  return <>{children}</>;
}


