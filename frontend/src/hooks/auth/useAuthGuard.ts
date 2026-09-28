/* ==========================================================================
   useAuthGuard Hook
   Compliance: ISO/IEC 25010 (Maintainability, Single Responsibility Principle),
   OWASP ASVS v4.0 (Authentication Verification & Session Integrity)
========================================================================== */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

// ---------------------------------------------------------------------------
// Constants & Pure Helpers
// ---------------------------------------------------------------------------

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/forgot'];

/**
 * Returns true if the locale-stripped pathname is a publicly accessible route.
 */
export function isPublicPath(path: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
    path.startsWith('/banned') ||
    path.startsWith('/verify')
  );
}

/**
 * Safely reads the auth token from localStorage (SSR-safe).
 */
export function getStoredToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook Logic
// ---------------------------------------------------------------------------

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const isPublic = isPublicPath(pathname);

  // SSR-safe initializer: uses only pathname (identical on server and client)
  const [isValidated, setIsValidated] = useState<boolean>(() => isPublic);

  const checkingRef = useRef(false);
  const redirectingToRef = useRef<string | null>(null);
  const validatedUserRef = useRef<{
    role?: string;
    emailVerified?: boolean;
    token: string;
  } | null>(null);

  const buildLoginRedirect = useCallback((targetPath: string) => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const fullTarget = targetPath + search;
    if (fullTarget === '/' || fullTarget === '/dashboard') return '/login';
    return `/login?redirect=${encodeURIComponent(fullTarget)}`;
  }, []);

  // ---------------------------------------------------------------------------
  // Auth state change listener (login / logout / token synchronization)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleAuthChange = () => {
      validatedUserRef.current = null;
      checkingRef.current = false;
      setIsValidated(isPublicPath(pathname) || Boolean(getStoredToken()));
    };

    window.addEventListener('user:refresh', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('user:refresh', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [pathname]);

  // ---------------------------------------------------------------------------
  // Main route authentication & role authorization effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isPublic) {
      setIsValidated(true);
      if (pathname === '/register') {
        const token = getStoredToken();
        if (token && redirectingToRef.current !== '/dashboard') {
          redirectingToRef.current = '/dashboard';
          router.replace('/dashboard');
        }
      }
      return;
    }

    const token = getStoredToken();

    // No token present — redirect unauthenticated user to login immediately
    if (!token) {
      setIsValidated(false);
      const loginDest = buildLoginRedirect(pathname);
      if (redirectingToRef.current !== loginDest) {
        redirectingToRef.current = loginDest;
        router.replace(loginDest);
      }
      return;
    }

    // Fast path: token already validated for this session
    if (validatedUserRef.current?.token === token) {
      if (pathname.startsWith('/admin') && validatedUserRef.current.role !== 'admin') {
        setIsValidated(false);
        if (redirectingToRef.current !== '/dashboard') {
          redirectingToRef.current = '/dashboard';
          router.replace('/dashboard');
        }
        return;
      }
      setIsValidated(true);
      return;
    }

    // Optimistically allow validated view while background verification executes
    setIsValidated(true);

    if (checkingRef.current) return;
    checkingRef.current = true;

    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const [meRes, brandingRes] = await Promise.all([
          fetchWithRetry(`${base}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }),
          fetchWithRetry(`${base}/api/branding`, { cache: 'no-store' }),
        ]);

        // 403: Account Banned
        if (meRes.status === 403) {
          setIsValidated(false);
          let d: any = {};
          try { d = await meRes.json(); } catch {}
          try {
            sessionStorage.setItem('is_banned', 'true');
            sessionStorage.setItem('ban_reason', d?.details?.reason ?? '');
            if (d?.details?.until) sessionStorage.setItem('ban_until', String(d.details.until));
            else sessionStorage.removeItem('ban_until');
            if (d?.details?.username) sessionStorage.setItem('ban_username', String(d.details.username));
          } catch {}
          if (redirectingToRef.current !== '/banned') {
            redirectingToRef.current = '/banned';
            router.replace('/banned');
          }
          return;
        }

        // 401: Invalid / Expired Token
        if (meRes.status === 401) {
          setIsValidated(false);
          validatedUserRef.current = null;
          try { localStorage.removeItem('auth_token'); } catch {}
          const loginDest = buildLoginRedirect(pathname);
          if (redirectingToRef.current !== loginDest) {
            redirectingToRef.current = loginDest;
            router.replace(loginDest);
          }
          return;
        }

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

        // Verification Required Check
        if (brandingData?.emailVerification && !userData?.emailVerified) {
          setIsValidated(false);
          try { sessionStorage.setItem('verify_email', userData?.email ?? ''); } catch {}
          if (redirectingToRef.current !== '/verify') {
            redirectingToRef.current = '/verify';
            router.replace('/verify');
          }
          return;
        }

        // Clean obsolete ban/verify states on active session
        try {
          sessionStorage.removeItem('is_banned');
          sessionStorage.removeItem('ban_reason');
          sessionStorage.removeItem('ban_until');
          sessionStorage.removeItem('verify_email');
        } catch {}

        // Admin Authorization Check
        if (pathname.startsWith('/admin') && userData?.role !== 'admin') {
          setIsValidated(false);
          if (redirectingToRef.current !== '/dashboard') {
            redirectingToRef.current = '/dashboard';
            router.replace('/dashboard');
          }
          return;
        }

        redirectingToRef.current = null;
        setIsValidated(true);
      } catch {
        // Network failure — maintain optimistic session
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [pathname, router, isPublic, buildLoginRedirect]);

  // ---------------------------------------------------------------------------
  // Direct access guards for /banned and /verify
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!pathname.startsWith('/banned')) return;
    try {
      const hasBan = Boolean(
        sessionStorage.getItem('is_banned') || sessionStorage.getItem('ban_reason')
      );
      if (!hasBan && redirectingToRef.current !== '/login') {
        const token = getStoredToken();
        const dest = token ? '/dashboard' : '/login';
        redirectingToRef.current = dest;
        router.replace(dest);
      }
    } catch {
      router.replace('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!pathname.startsWith('/verify')) return;
    try {
      const hasVerify = Boolean(sessionStorage.getItem('verify_email'));
      if (!hasVerify && redirectingToRef.current !== '/login') {
        const token = getStoredToken();
        const dest = token ? '/dashboard' : '/login';
        redirectingToRef.current = dest;
        router.replace(dest);
      }
    } catch {
      router.replace('/login');
    }
  }, [pathname, router]);

  // ---------------------------------------------------------------------------
  // Realtime global account:banned event listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleAccountBanned = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        try {
          sessionStorage.setItem('is_banned', 'true');
          if (customEvent.detail.reason)
            sessionStorage.setItem('ban_reason', String(customEvent.detail.reason));
          if (customEvent.detail.until)
            sessionStorage.setItem('ban_until', String(customEvent.detail.until));
          if (customEvent.detail.username)
            sessionStorage.setItem('ban_username', String(customEvent.detail.username));
        } catch {}
      }
      setIsValidated(false);
      if (redirectingToRef.current !== '/banned') {
        redirectingToRef.current = '/banned';
        router.replace('/banned');
      }
    };

    window.addEventListener('account:banned', handleAccountBanned);
    return () => window.removeEventListener('account:banned', handleAccountBanned);
  }, [router]);

  return { isValidated, isPublic };
}
