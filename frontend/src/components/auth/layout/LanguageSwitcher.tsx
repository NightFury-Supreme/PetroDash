'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { localeLabels, type Locale } from '@/i18n/routing';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageSwitcher({ 
  align = 'left', 
  direction = 'up',
  variant = 'outline'
}: { 
  align?: 'left' | 'right',
  direction?: 'up' | 'down',
  variant?: 'outline' | 'ghost'
} = {}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const ref = useRef<HTMLDivElement>(null);

  const currentLocale = (params.locale as Locale) ?? 'en';
  const current = localeLabels[currentLocale];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const switchLocale = (locale: Locale) => {
    setOpen(false);
    startTransition(() => {
      router.replace(pathname as any, { locale });
    });
  };

  const localeEntries = Object.entries(localeLabels) as [Locale, typeof localeLabels[Locale]][];

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        disabled={isPending}
        className={[
          'flex items-center gap-1.5 transition-all duration-150 select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5722]',
          variant === 'outline' 
            ? 'px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium text-[#888] border border-[#222] bg-[#0F0F0F] hover:border-[#383838] hover:text-[#ccc]'
            : 'text-[#888] hover:text-[#D4D4D4] bg-transparent p-1',
          isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer',
        ].join(' ')}
      >
        <Globe size={variant === 'ghost' ? 16 : 13} className="shrink-0" />
        {variant === 'outline' && (
          <span className="hidden sm:inline leading-none">{current.flag}</span>
        )}
        <span className={`hidden sm:inline leading-none ${variant === 'ghost' ? 'text-sm ml-0.5' : ''}`}>
          {variant === 'ghost' ? current.label.slice(0, 3) : current.label}
        </span>
        <ChevronDown
          size={variant === 'ghost' ? 14 : 11}
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Language options"
          className={[
            'absolute',
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
            align === 'right' ? 'end-0' : 'start-0',
            'z-50 min-w-[170px]',
            'rounded-[10px] border border-[#222] bg-[#111]',
            'shadow-2xl shadow-black/60',
            'py-1.5 overflow-hidden',
            direction === 'up' 
              ? 'animate-in fade-in slide-in-from-bottom-2 duration-150'
              : 'animate-in fade-in slide-in-from-top-2 duration-150',
          ].join(' ')}
        >
          {localeEntries.map(([locale, meta]) => {
            const isActive = locale === currentLocale;
            return (
              <button
                key={locale}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => switchLocale(locale)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2',
                  'text-[13px] text-start transition-colors duration-100',
                  'focus:outline-none',
                  isActive
                    ? 'text-white bg-[#FF5722]/10'
                    : 'text-[#aaa] hover:text-white hover:bg-[#1a1a1a]',
                ].join(' ')}
              >
                <span className="text-base leading-none w-5 shrink-0 text-center" aria-hidden>
                  {meta.flag}
                </span>
                <span className="flex-1 leading-none">{meta.label}</span>
                {meta.dir === 'rtl' && (
                  <span className="text-[10px] text-[#555] font-mono uppercase shrink-0">RTL</span>
                )}
                {isActive && (
                  <Check size={12} className="text-[#FF5722] shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
