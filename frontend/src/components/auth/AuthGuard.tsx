"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PUBLIC_PATHS = ["/login", "/register", "/auth/callback", "/forgot"];

// ---------------------------------------------------------------------------
// Helpers (module-level — safe to call inside useState lazy initializer)
// ---------------------------------------------------------------------------

/**
 * Determines whether a given (locale-stripped) pathname is publicly accessible
 * without authentication.
 */
function isPublicPath(path: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
    path.startsWith("/banned") ||
    path.startsWith("/verify")
  );
}

/**
 * Synchronously reads localStorage without throwing.
 * Returns null on SSR or any storage error.
 */
function getStoredToken(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// AuthGuard
// ---------------------------------------------------------------------------

/**
 * Client-side authentication gate.
 *
 * Behaviour:
 * - Public paths (/login, /register, /forgot, /verify, /banned):
 *     render immediately, no network call.
 * - Protected paths with a stored token:
 *     render children optimistically on the FIRST render (no flash for
 *     already-authenticated users), then verify via /api/auth/me async.
 *     If the token is stale/banned, the user is redirected after validation.
 * - Protected paths with NO stored token:
 *     render nothing (null) on the first render — avoids any skeleton/layout
 *     flash — and immediately redirect to /login?redirect=<currentPath>.
 *
 * This mirrors the pattern used by Discord, GitHub, etc.: unauthenticated
 * visits to protected pages go directly to the login page with no intermediate
 * loading state.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // next-intl's usePathname already strips the locale prefix
  const pathname = usePathname() || "/";

  const isPublic = isPublicPath(pathname);

  /**
   * Lazy initializer — runs synchronously on first render (no effect needed).
   *
   * • Public path  → true  (render immediately, always)
   * • Protected + token exists → true  (optimistic render; async re-validation follows)
   * • Protected + no token     → false (render null; effect fires redirect instantly)
   */
  const [isValidated, setIsValidated] = useState<boolean>(() => {
    if (isPublic) return true;
    return Boolean(getStoredToken());
  });

  const checkingRef = useRef(false);
  const redirectingToRef = useRef<string | null>(null);
  const validatedUserRef = useRef<{
    role?: string;
    emailVerified?: boolean;
    token: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const buildLoginRedirect = useCallback((targetPath: string) => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const fullTarget = targetPath + search;
    if (fullTarget === "/" || fullTarget === "/dashboard") return "/login";
    return `/login?redirect=${encodeURIComponent(fullTarget)}`;
  }, []);

  // ---------------------------------------------------------------------------
  // Auth-change listener — resets validation state on login / logout
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleAuthChange = () => {
      validatedUserRef.current = null;
      checkingRef.current = false;
      // Re-evaluate synchronously: if there's a token we stay optimistic,
      // otherwise drop to false so the redirect fires.
      setIsValidated(isPublicPath(pathname) || Boolean(getStoredToken()));
    };
    window.addEventListener("user:refresh", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("user:refresh", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [pathname]);

  // ---------------------------------------------------------------------------
  // Main validation effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Public pages: nothing to validate.
    if (isPublic) {
      setIsValidated(true);
      // Prevent authenticated users from lingering on /register.
      if (pathname === "/register") {
        const token = getStoredToken();
        if (token && redirectingToRef.current !== "/dashboard") {
          redirectingToRef.current = "/dashboard";
          router.replace("/dashboard");
        }
      }
      return;
    }

    const token = getStoredToken();

    // No token — fire redirect immediately.
    if (!token) {
      setIsValidated(false);
      const loginDest = buildLoginRedirect(pathname);
      if (redirectingToRef.current !== loginDest) {
        redirectingToRef.current = loginDest;
        router.replace(loginDest);
      }
      return;
    }

    // Fast path: same token already validated this session.
    if (validatedUserRef.current?.token === token) {
      if (pathname.startsWith("/admin") && validatedUserRef.current.role !== "admin") {
        setIsValidated(false);
        if (redirectingToRef.current !== "/dashboard") {
          redirectingToRef.current = "/dashboard";
          router.replace("/dashboard");
        }
        return;
      }
      setIsValidated(true);
      return;
    }

    // Guard against concurrent validation calls.
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
            sessionStorage.setItem("ban_reason", d?.details?.reason ?? "");
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

        // — Unauthorized / expired token (401) —
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

        // — Server / network error: allow the authenticated user through —
        if (!meRes.ok) {
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
          try { sessionStorage.setItem("verify_email", userData?.email ?? ""); } catch {}
          if (redirectingToRef.current !== "/verify") {
            redirectingToRef.current = "/verify";
            router.replace("/verify");
          }
          return;
        }

        // Clear stale ban/verify context.
        try {
          sessionStorage.removeItem("is_banned");
          sessionStorage.removeItem("ban_reason");
          sessionStorage.removeItem("ban_until");
          sessionStorage.removeItem("verify_email");
        } catch {}

        // — Admin route, non-admin user —
        if (pathname.startsWith("/admin") && userData?.role !== "admin") {
          setIsValidated(false);
          if (redirectingToRef.current !== "/dashboard") {
            redirectingToRef.current = "/dashboard";
            router.replace("/dashboard");
          }
          return;
        }

        redirectingToRef.current = null;
        setIsValidated(true);
      } catch {
        // Network failure — let the authenticated user through gracefully.
        setIsValidated(true);
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [pathname, router, isPublic, buildLoginRedirect]);

  // ---------------------------------------------------------------------------
  // Guard: direct access to /banned without ban context
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!pathname.startsWith("/banned")) return;
    try {
      const hasBan = Boolean(
        sessionStorage.getItem("is_banned") || sessionStorage.getItem("ban_reason")
      );
      if (!hasBan && redirectingToRef.current !== "/login") {
        const token = getStoredToken();
        const dest = token ? "/dashboard" : "/login";
        redirectingToRef.current = dest;
        router.replace(dest);
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  // ---------------------------------------------------------------------------
  // Guard: direct access to /verify without verify context
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!pathname.startsWith("/verify")) return;
    try {
      const hasVerify = Boolean(sessionStorage.getItem("verify_email"));
      if (!hasVerify && redirectingToRef.current !== "/login") {
        const token = getStoredToken();
        const dest = token ? "/dashboard" : "/login";
        redirectingToRef.current = dest;
        router.replace(dest);
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  // ---------------------------------------------------------------------------
  // Global account:banned event
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleAccountBanned = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        try {
          sessionStorage.setItem("is_banned", "true");
          if (customEvent.detail.reason)
            sessionStorage.setItem("ban_reason", String(customEvent.detail.reason));
          if (customEvent.detail.until)
            sessionStorage.setItem("ban_until", String(customEvent.detail.until));
          if (customEvent.detail.username)
            sessionStorage.setItem("ban_username", String(customEvent.detail.username));
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Public pages and validated sessions render children.
  if (isPublic || isValidated) {
    return <>{children}</>;
  }

  /**
   * Not yet validated (no token or pending async revalidation).
   *
   * Shows a minimal full-screen loading spinner so the user sees progress
   * rather than a completely blank page during the brief redirect window.
   *
   * For unauthenticated visits (no token) this is displayed for only the
   * single frame before the effect fires and navigation begins.
   * For stale-token revalidation (rare), it persists until /api/auth/me responds.
   */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]"
      aria-label="Loading"
      role="status"
    >
      <div
        className="h-10 w-10 rounded-full border-2 border-[#303030] border-t-white"
        style={{ animation: "auth-spin 0.75s linear infinite" }}
      />
      <style>{`
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
