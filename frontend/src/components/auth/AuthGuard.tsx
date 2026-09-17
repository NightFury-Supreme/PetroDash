"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { RouteSkeleton } from "@/components/skeletons/layout/RouteSkeleton";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/auth/callback",
  "/forgot",
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // next-intl usePathname already strips the locale prefix (e.g. /es/login -> /login)
  const pathname = usePathname() || "/";

  // Tracks whether we've already validated for this pathname
  const checkedPathRef = useRef<string | null>(null);
  // Prevents concurrent validation calls
  const checkingRef = useRef(false);
  // Tracks current redirect target to avoid re-redirecting to the same path
  const redirectingToRef = useRef<string | null>(null);
  
  // Actually block rendering of protected pages until validated
  const [isValidated, setIsValidated] = useState(false);
  const [, forceRender] = useState(0);

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/banned") ||
    pathname.startsWith("/verify");

  useEffect(() => {
    // If we switch to a new non-public path, we need to validate again
    if (checkedPathRef.current !== pathname && !isPublic) {
      setIsValidated(false);
    }

    // Already checked this exact pathname in this session — skip
    if (checkedPathRef.current === pathname) return;
    // Already mid-check — skip
    if (checkingRef.current) return;
    // Public pages never need token validation
    if (isPublic) {
      checkedPathRef.current = pathname;
      setIsValidated(true);
      return;
    }

    checkingRef.current = true;

    (async () => {
      try {
        const token = typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

        if (!token) {
          if (redirectingToRef.current !== "/login") {
            redirectingToRef.current = "/login";
            router.replace("/login");
          }
          return;
        }

        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const [meRes, brandingRes] = await Promise.all([
          fetchWithRetry(`${base}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetchWithRetry(`${base}/api/branding`, { cache: "no-store" }),
        ]);

        // — Banned —
        if (meRes.status === 403) {
          let d: any = {};
          try { d = await meRes.json(); } catch {}
          try {
            if (d?.reason) sessionStorage.setItem("ban_reason", d.reason);
            if (d?.until) sessionStorage.setItem("ban_until", String(d.until));
            else sessionStorage.removeItem("ban_until");
          } catch {}
          if (redirectingToRef.current !== "/banned") {
            redirectingToRef.current = "/banned";
            router.replace("/banned");
          }
          return;
        }

        // — Unauthorized (invalid token) —
        if (meRes.status === 401) {
          try { localStorage.removeItem("auth_token"); } catch {}
          if (redirectingToRef.current !== "/login") {
            redirectingToRef.current = "/login";
            router.replace("/login");
          }
          return;
        }

        // — Other errors (network, 5xx) — don't kick user out —
        if (!meRes.ok) {
          checkedPathRef.current = pathname;
          setIsValidated(true);
          return;
        }

        // — Auth OK —
        let userData: any = {};
        let brandingData: any = {};
        try { userData = await meRes.json(); } catch {}
        try { brandingData = await brandingRes.json(); } catch {}

        // — Email verification required —
        if (brandingData?.emailVerification && !userData?.emailVerified) {
          try { sessionStorage.setItem("verify_email", userData?.email || ""); } catch {}
          if (redirectingToRef.current !== "/verify") {
            redirectingToRef.current = "/verify";
            router.replace("/verify");
          }
          return;
        }

        // — All good — clear any stale ban/verify context —
        try {
          sessionStorage.removeItem("ban_reason");
          sessionStorage.removeItem("ban_until");
          sessionStorage.removeItem("verify_email");
        } catch {}

        // Reset redirect tracker since we're validated now
        redirectingToRef.current = null;
        checkedPathRef.current = pathname;
        setIsValidated(true);
        forceRender(n => n + 1); // allow children to paint
      } catch {
        // Network error — don't redirect, just mark as checked to stop retrying
        checkedPathRef.current = pathname;
        setIsValidated(true);
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [pathname, router]);

  // — Direct /banned access without ban context → redirect —
  useEffect(() => {
    if (!pathname.startsWith("/banned")) return;
    try {
      const hasBan = Boolean(sessionStorage.getItem("ban_reason"));
      if (!hasBan && redirectingToRef.current !== "/login") {
        const token = localStorage.getItem("auth_token");
        const dest = token ? "/" : "/login";
        redirectingToRef.current = dest;
        router.replace(dest);
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  // — Direct /verify access without verify context → redirect —
  useEffect(() => {
    if (!pathname.startsWith("/verify")) return;
    try {
      const hasVerify = Boolean(sessionStorage.getItem("verify_email"));
      if (!hasVerify && redirectingToRef.current !== "/login") {
        const token = localStorage.getItem("auth_token");
        const dest = token ? "/" : "/login";
        redirectingToRef.current = dest;
        router.replace(dest);
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  if (!isPublic && !isValidated) {
    return (
      <RouteSkeleton />
    );
  }

  return <>{children}</>;
}
