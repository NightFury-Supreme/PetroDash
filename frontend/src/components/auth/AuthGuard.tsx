"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "@/i18n/routing";

const PUBLIC_PATHS: readonly string[] = [
  "/login",
  "/register",
  "/auth/callback",
  "/banned",
  "/verify",
  "/forgot",
];

function normalizePath(pathname: string): string {
  let p = pathname;
  if (p.startsWith("/en/")) p = p.substring(3);
  else if (p === "/en") p = "/";
  if (p.startsWith("/es/")) p = p.substring(3);
  else if (p === "/es") p = "/";
  return p || "/";
}

function isPublicPath(normalizedPath: string): boolean {
  if (normalizedPath.startsWith("/banned")) {
    try { return Boolean(sessionStorage.getItem("ban_reason")); } catch { return false; }
  }
  if (normalizedPath.startsWith("/verify")) {
    try { return Boolean(sessionStorage.getItem("verify_email")); } catch { return false; }
  }
  if (normalizedPath.startsWith("/forgot")) return true;
  if (normalizedPath === "/") return false;
  return PUBLIC_PATHS.some((p) => normalizedPath.startsWith(p));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const routerRef = useRef(router);
  const inFlightRef = useRef(false);
  const lastCheckedPathRef = useRef<string | null>(null);

  // Keep routerRef current without causing re-renders
  useEffect(() => {
    routerRef.current = router;
  });

  useEffect(() => {
    const normalized = normalizePath(pathname);

    // --- Guard: /banned without ban context ---
    if (normalized.startsWith("/banned")) {
      try {
        const hasBan = Boolean(sessionStorage.getItem("ban_reason"));
        if (!hasBan) {
          const token = localStorage.getItem("auth_token");
          routerRef.current.replace(token ? "/" : "/login");
        }
      } catch {
        routerRef.current.replace("/login");
      }
      return;
    }

    // --- Guard: /verify without verify context ---
    if (normalized.startsWith("/verify")) {
      try {
        const hasVerify = Boolean(sessionStorage.getItem("verify_email"));
        if (!hasVerify) {
          const token = localStorage.getItem("auth_token");
          routerRef.current.replace(token ? "/" : "/login");
        }
      } catch {
        routerRef.current.replace("/login");
      }
      return;
    }

    // --- Public path: no auth check needed ---
    if (isPublicPath(normalized)) return;

    // --- Protected path: only re-check if path changed ---
    if (inFlightRef.current) return;
    if (lastCheckedPathRef.current === normalized) return;

    inFlightRef.current = true;
    lastCheckedPathRef.current = normalized;

    (async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          routerRef.current.replace("/login");
          return;
        }

        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const [res, brandingRes] = await Promise.all([
          fetchWithRetry(`${base}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetchWithRetry(`${base}/api/branding`, { cache: "no-store" }),
        ]);

        if (res.status === 403) {
          let d: any = {};
          try { d = await res.json(); } catch {}
          if (d?.reason) sessionStorage.setItem("ban_reason", d.reason);
          else sessionStorage.removeItem("ban_reason");
          if (d?.until) sessionStorage.setItem("ban_until", String(d.until));
          else sessionStorage.removeItem("ban_until");
          routerRef.current.replace("/banned");
          return;
        }

        if (res.status === 401) {
          localStorage.removeItem("auth_token");
          routerRef.current.replace("/login");
          return;
        }

        if (res.ok) {
          let data: any = {};
          try { data = await res.json(); } catch {}
          let brandingData: any = {};
          try { brandingData = await brandingRes.json(); } catch {}

          if (brandingData.emailVerification && !data.emailVerified) {
            sessionStorage.setItem("verify_email", data.email || "");
            routerRef.current.replace("/verify");
            return;
          }

          // Auth OK — clear stale markers
          sessionStorage.removeItem("ban_reason");
          sessionStorage.removeItem("ban_until");
          sessionStorage.removeItem("verify_email");
        }
      } catch {
        // Network error — don't force logout
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
