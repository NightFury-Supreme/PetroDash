'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  fetchCurrentUser,
  getCachedUserSync,
  AuthError,
  type UserProfileData,
} from '@/utils/userCache';
import { fetchBrandingData, type BrandingInfo } from '@/utils/configCache';
import {
  safeSessionSet,
  safeLocalStorageRemove,
  clearAuthSession,
  stripLocale,
  isPublicPath,
  getStoredToken,
} from './authGuard.utils';

export { stripLocale, isPublicPath, getStoredToken };

export function useAuthGuard() {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = rawPathname || (typeof window !== 'undefined' ? stripLocale(window.location.pathname) : '/');

  const isPublic = isPublicPath(pathname);
  const [isValidated, setIsValidated] = useState<boolean>(() => {
    if (isPublic) return true;
    if (typeof window === 'undefined') return false;
    const token = getStoredToken();
    const cached = getCachedUserSync();
    if (token && cached) {
      if (pathname.startsWith('/admin') && cached.role !== 'admin') {
        return false;
      }
      return true;
    }
    return false;
  });

  const checkingRef = useRef(false);
  const redirectingToRef = useRef<string | null>(null);
  const validatedUserRef = useRef<{
    role?: string;
    emailVerified?: boolean;
    token: string;
  } | null>(null);

  const buildLoginRedirect = useCallback((targetPath: string) => {
    const clean = stripLocale(targetPath);
    if (isPublicPath(clean) || clean === '/' || clean === '/dashboard') return '/login';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const fullTarget = clean + search;
    return `/login?redirect=${encodeURIComponent(fullTarget)}`;
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      validatedUserRef.current = null;
      checkingRef.current = false;
      const token = getStoredToken();
      const cached = getCachedUserSync();
      setIsValidated(isPublicPath(pathname) || Boolean(token && cached));
    };

    window.addEventListener('user:refresh', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('user:refresh', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (isPublic) {
      setIsValidated(true);
      if (pathname === '/register' || pathname.startsWith('/join')) {
        const token = getStoredToken();
        if (token && redirectingToRef.current !== '/dashboard') {
          redirectingToRef.current = '/dashboard';
          router.replace('/dashboard');
        }
      }
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setIsValidated(false);
      const loginDest = buildLoginRedirect(pathname);
      if (redirectingToRef.current !== loginDest) {
        redirectingToRef.current = loginDest;
        router.replace(loginDest);
      }
      return;
    }

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

    const cachedUser = getCachedUserSync();
    if (cachedUser) {
      validatedUserRef.current = {
        token,
        role: cachedUser.role,
        emailVerified: Boolean(cachedUser.emailVerified),
      };
      if (pathname.startsWith('/admin') && cachedUser.role !== 'admin') {
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

    if (checkingRef.current) return;
    checkingRef.current = true;

    (async () => {
      try {
        let userData: UserProfileData | null = null;
        let brandingData: BrandingInfo | null = null;
        try {
          [userData, brandingData] = await Promise.all([
            fetchCurrentUser(),
            fetchBrandingData(),
          ]);
        } catch (err: unknown) {
          if (err instanceof AuthError) {
            if (err.status === 403) {
              setIsValidated(false);
              if (redirectingToRef.current !== '/banned') {
                redirectingToRef.current = '/banned';
                router.replace('/banned');
              }
              return;
            }
            if (err.status === 401 || err.status === 404) {
              setIsValidated(false);
              validatedUserRef.current = null;
              safeLocalStorageRemove('auth_token');
              const loginDest = buildLoginRedirect(pathname);
              if (redirectingToRef.current !== loginDest) {
                redirectingToRef.current = loginDest;
                router.replace(loginDest);
              }
              return;
            }
          }
          setIsValidated(true);
          return;
        }

        if (!userData) {
          setIsValidated(true);
          return;
        }

        validatedUserRef.current = {
          token,
          role: userData.role,
          emailVerified: Boolean(userData.emailVerified),
        };

        if (brandingData?.emailVerification && !userData.emailVerified) {
          setIsValidated(false);
          safeSessionSet('verify_email', userData.email ?? '');
          if (redirectingToRef.current !== '/verify') {
            redirectingToRef.current = '/verify';
            router.replace('/verify');
          }
          return;
        }

        clearAuthSession();

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
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [pathname, router, isPublic, buildLoginRedirect]);

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
      const token = getStoredToken();
      if (!token && redirectingToRef.current !== '/login') {
        redirectingToRef.current = '/login';
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    const handleAccountBanned = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        safeSessionSet('is_banned', 'true');
        if (customEvent.detail.reason)
          safeSessionSet('ban_reason', String(customEvent.detail.reason));
        if (customEvent.detail.until)
          safeSessionSet('ban_until', String(customEvent.detail.until));
        if (customEvent.detail.username)
          safeSessionSet('ban_username', String(customEvent.detail.username));
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
