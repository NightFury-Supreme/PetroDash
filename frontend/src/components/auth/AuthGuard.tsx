"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PUBLIC_PATHS = ["/login", "/register", "/auth/callback", "/forgot"];

// ---------------------------------------------------------------------------
// Module-level helpers (no browser APIs — safe for SSR + lazy initializers)
// ---------------------------------------------------------------------------

/**
 * Returns true if the locale-stripped pathname is a publicly accessible route
 * that never requires authentication.
 */
function isPublicPath(path: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
    path.startsWith("/banned") ||
    path.startsWith("/verify")
  );
}

/**
 * Reads the stored auth token without throwing.
 * Returns null during SSR or on any storage error.
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
 * Render contract (SSR-safe, zero hydration errors):
 *
 *   Server render  → isPublicPath(pathname)
 *   Client first render → same (no localStorage access)
 *   After hydration (useEffect) → optimistically true if token present
 *
 * User experience:
 *   • Public paths   : render immediately, no network call.
 *   • Protected + token exists : one effect cycle (~1 frame) of spinner,
 *     then children. Async /api/auth/me validation runs in the background;
 *     if stale/banned, the user is silently redirected.
 *   • Protected + no token : spinner shown briefly, redirect fires in the
 *     first effect run. Never renders the protected shell.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // next-intl strips the locale prefix (e.g. /es/dashboard → /dashboard)
  const pathname = usePathname() || "/";

  const isPublic = isPublicPath(pathname);

  /**
   * SSR-safe initializer — uses only `pathname`, identical on server & client.
   * Never reads localStorage here to prevent server/client mismatch.
   *
   * Public paths start validated.
   * Protected paths start unvalidated; the effect below fast-tracks to true
   * if a token exists (avoiding a visible flash for authenticated users).
   */
  const [isValidated, setIsValidated] = useState<boolean>(() => isPublic);

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
  // Auth-change listener — resets on login / logout / token change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleAuthChange = () => {
      validatedUserRef.current = null;
      checkingRef.current = false;
      // Synchronize with current token state after auth change
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
      // Prevent authenticated users from sitting on /register.
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

    // No token — redirect immediately, keep spinner visible.
    if (!token) {
      setIsValidated(false);
      const loginDest = buildLoginRedirect(pathname);
      if (redirectingToRef.current !== loginDest) {
        redirectingToRef.current = loginDest;
        router.replace(loginDest);
      }
      return;
    }

    // ── Optimistic fast-path ──────────────────────────────────────────────
    // Token is present → show children immediately without waiting for the
    // network round-trip. This collapses the spinner to zero visible time
    // for normal authenticated navigation.
    //
    // The async validation below runs in the background. If it finds the
    // token is stale or the account banned, it will hide the children and
    // redirect — but this is the uncommon path.
    if (validatedUserRef.current?.token === token) {
      // Fast path: same token already validated this session.
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

    // Optimistically allow through before async check completes.
    setIsValidated(true);

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

        // — Server / network error: leave optimistic render as-is —
        if (!meRes.ok) return;

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
        // Network failure — leave the optimistic render; user already sees the page.
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

  if (isPublic || isValidated) {
    return <>{children}</>;
  }

  /**
   * Spinner is shown only when:
   * 1. A protected page loads with no stored token (briefly, until redirect fires)
   * 2. A stale token is being async-validated (uncommon, lasts until /api/auth/me responds)
   *
   * Normal authenticated navigation never hits this branch because
   * setIsValidated(true) is called optimistically above before the API call.
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
