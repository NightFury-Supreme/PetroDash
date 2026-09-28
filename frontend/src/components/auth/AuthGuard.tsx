"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

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

  // Tracks validated state for current pathname to block protected UI until authorized
  const [isValidated, setIsValidated] = useState(false);
  const checkedPathRef = useRef<string | null>(null);
  const checkingRef = useRef(false);
  const redirectingToRef = useRef<string | null>(null);
  const validatedUserRef = useRef<{ role?: string; emailVerified?: boolean; token: string } | null>(null);

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/banned") ||
    pathname.startsWith("/verify");

  const buildLoginRedirect = useCallback((targetPath: string) => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const fullTarget = targetPath + search;
    if (fullTarget === "/" || fullTarget === "/dashboard") {
      return "/login";
    }
    return `/login?redirect=${encodeURIComponent(fullTarget)}`;
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      checkedPathRef.current = null;
      validatedUserRef.current = null;
      checkingRef.current = false;
      setIsValidated(false);
    };

    window.addEventListener("user:refresh", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("user:refresh", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // Public pages never require token validation
    if (isPublic) {
      checkedPathRef.current = pathname;
      setIsValidated(true);
      if (pathname === "/register") {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (token && redirectingToRef.current !== "/dashboard") {
          redirectingToRef.current = "/dashboard";
          router.replace("/dashboard");
        }
      }
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (!token) {
      setIsValidated(false);
      const loginDest = buildLoginRedirect(pathname);
      if (redirectingToRef.current !== loginDest) {
        redirectingToRef.current = loginDest;
        router.replace(loginDest);
      }
      return;
    }

    // Fast path: if token is identical and user already validated in this session
    if (validatedUserRef.current && validatedUserRef.current.token === token) {
      if (pathname.startsWith("/admin") && validatedUserRef.current.role !== "admin") {
        setIsValidated(false);
        if (redirectingToRef.current !== "/dashboard") {
          redirectingToRef.current = "/dashboard";
          router.replace("/dashboard");
        }
        return;
      }
      checkedPathRef.current = pathname;
      setIsValidated(true);
      return;
    }

    // Already checked this exact pathname and authorized
    if (checkedPathRef.current === pathname && isValidated) return;
    if (checkingRef.current) return;

    checkingRef.current = true;

    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const [meRes, brandingRes] = await Promise.all([
          fetchWithRetry(`${base}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetchWithRetry(`${base}/api/branding`, { cache: "no-store" }),
        ]);

        // — Banned (403) —
        if (meRes.status === 403) {
          setIsValidated(false);
          let d: any = {};
          try { d = await meRes.json(); } catch {}
          try {
            sessionStorage.setItem("is_banned", "true");
            if (d?.details?.reason) sessionStorage.setItem("ban_reason", d.details.reason);
            else sessionStorage.setItem("ban_reason", "");
            if (d?.details?.until) sessionStorage.setItem("ban_until", String(d.details.until));
            else sessionStorage.removeItem("ban_until");
            if (d?.details?.username) sessionStorage.setItem("ban_username", String(d.details.username));
          } catch {}
          if (redirectingToRef.current !== "/banned") {
            redirectingToRef.current = "/banned";
            router.replace("/banned");
          }
          return;
        }

        // — Unauthorized / Expired Token (401) —
        if (meRes.status === 401) {
          setIsValidated(false);
          validatedUserRef.current = null;
          try { localStorage.removeItem("auth_token"); } catch {}
          const loginDest = buildLoginRedirect(pathname);
          if (redirectingToRef.current !== loginDest) {
            redirectingToRef.current = loginDest;
            router.replace(loginDest);
          }
          return;
        }

        // — Server or network error (non-auth): allow existing authenticated user through —
        if (!meRes.ok) {
          checkedPathRef.current = pathname;
          setIsValidated(true);
          return;
        }

        let userData: any = {};
        let brandingData: any = {};
        try { userData = await meRes.json(); } catch {}
        try { brandingData = await brandingRes.json(); } catch {}

        validatedUserRef.current = {
          token,
          role: userData?.role,
          emailVerified: Boolean(userData?.emailVerified),
        };

        // — Email verification required —
        if (brandingData?.emailVerification && !userData?.emailVerified) {
          setIsValidated(false);
          try { sessionStorage.setItem("verify_email", userData?.email || ""); } catch {}
          if (redirectingToRef.current !== "/verify") {
            redirectingToRef.current = "/verify";
            router.replace("/verify");
          }
          return;
        }

        // — Clear any stale ban/verify context —
        try {
          sessionStorage.removeItem("is_banned");
          sessionStorage.removeItem("ban_reason");
          sessionStorage.removeItem("ban_until");
          sessionStorage.removeItem("verify_email");
        } catch {}

        // — Restrict /admin to admin role —
        if (pathname.startsWith("/admin") && userData?.role !== "admin") {
          setIsValidated(false);
          if (redirectingToRef.current !== "/dashboard") {
            redirectingToRef.current = "/dashboard";
            router.replace("/dashboard");
          }
          return;
        }

        redirectingToRef.current = null;
        checkedPathRef.current = pathname;
        setIsValidated(true);
      } catch {
        // Network failure — allow graceful client display rather than permanent blank
        checkedPathRef.current = pathname;
        setIsValidated(true);
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [pathname, router, isPublic, isValidated, buildLoginRedirect]);

  // — Direct /banned access without ban context → redirect —
  useEffect(() => {
    if (!pathname.startsWith("/banned")) return;
    try {
      const hasBan = Boolean(sessionStorage.getItem("is_banned") || sessionStorage.getItem("ban_reason"));
      if (!hasBan && redirectingToRef.current !== "/login") {
        const token = localStorage.getItem("auth_token");
        const dest = token ? "/dashboard" : "/login";
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
        const dest = token ? "/dashboard" : "/login";
        redirectingToRef.current = dest;
        router.replace(dest);
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  // — Global account:banned event listener —
  useEffect(() => {
    const handleAccountBanned = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        try {
          sessionStorage.setItem("is_banned", "true");
          if (customEvent.detail.reason) sessionStorage.setItem("ban_reason", String(customEvent.detail.reason));
          if (customEvent.detail.until) sessionStorage.setItem("ban_until", String(customEvent.detail.until));
          if (customEvent.detail.username) sessionStorage.setItem("ban_username", String(customEvent.detail.username));
        } catch {}
      }
      setIsValidated(false);
      if (redirectingToRef.current !== "/banned") {
        redirectingToRef.current = "/banned";
        router.replace("/banned");
      }
    };
    window.addEventListener("account:banned", handleAccountBanned);
    return () => window.removeEventListener("account:banned", handleAccountBanned);
  }, [router]);

  // Public pages render immediately. Protected pages render only once validated.
  if (isPublic || isValidated) {
    return <>{children}</>;
  }

  // Neutral shell placeholder while validating protected routes (avoids child hook execution & UI flash)
  return <div className="min-h-screen bg-[#0F0F0F]" />;
}



