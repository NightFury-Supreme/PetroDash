'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function startTopProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('navigation:start'));
  }
}

export function finishTopProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('navigation:finish'));
  }
}

function TopProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPathRef = useRef<string>('');

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  const finishProgress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsFinishing(true);

    fadeTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setIsFinishing(false);
    }, 200);
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setIsFinishing(false);
    setVisible(true);

    timeoutRef.current = setTimeout(() => {
      finishProgress();
    }, 8000);
  }, [clearTimers, finishProgress]);

  useEffect(() => {
    const fullPath = `${pathname}${searchParams ? `?${searchParams.toString()}` : ''}`;
    if (currentPathRef.current && currentPathRef.current !== fullPath) {
      finishProgress();
    }
    currentPathRef.current = fullPath;
  }, [pathname, searchParams, finishProgress]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        if (url.href === window.location.href) return;

        startProgress();
      } catch {
        return;
      }
    };

    const handlePopState = () => {
      startProgress();
    };

    const handleCustomStart = () => startProgress();
    const handleCustomFinish = () => finishProgress();

    document.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('navigation:start', handleCustomStart);
    window.addEventListener('navigation:finish', handleCustomFinish);

    return () => {
      clearTimers();
      document.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigation:start', handleCustomStart);
      window.removeEventListener('navigation:finish', handleCustomFinish);
    };
  }, [startProgress, finishProgress, clearTimers]);

  if (!visible && !isFinishing) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[2.5px] overflow-hidden bg-transparent"
      style={{
        opacity: isFinishing ? 0 : visible ? 1 : 0,
        transition: 'opacity 200ms ease-in-out',
      }}
    >
      <div
        className="absolute top-0 bottom-0 bg-[#FF5722]"
        style={{
          animation: 'material-progress-1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
        }}
      />
      <div
        className="absolute top-0 bottom-0 bg-[#FF5722]"
        style={{
          animation: 'material-progress-2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite',
        }}
      />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarInner />
    </Suspense>
  );
}
