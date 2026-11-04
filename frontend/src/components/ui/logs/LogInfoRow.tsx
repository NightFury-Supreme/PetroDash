import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';

export function DiffPills({ oldVal, newVal }: { oldVal: string; newVal: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end ml-auto shrink-0">
      <span className="font-mono text-[11px] text-red-400/80 bg-red-500/[0.06] px-2 py-0.5 rounded">
        {oldVal}
      </span>
      <span className="text-white/40 text-[10px]">&rarr;</span>
      <span className="font-mono text-[11px] text-emerald-400/80 bg-emerald-500/[0.06] px-2 py-0.5 rounded">
        {newVal}
      </span>
    </div>
  );
}

export function InfoRow({
  label,
  value,
  mono = false,
  muted = false,
  copyable = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  muted?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const tCommon = useTranslations('Common');
  const { showSuccess } = useToast();

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (value === null || value === undefined || value === '') return;
      navigator.clipboard.writeText(String(value)).then(() => {
        setCopied(true);
        showSuccess(tCommon('copiedSuccess'));
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [value, showSuccess, tCommon]
  );

  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
      <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">
        {label}
      </span>
      <div className="flex items-center justify-end gap-1.5 min-w-0">
        <span
          className={[
            'text-right break-all text-[11px]',
            mono ? 'font-mono' : '',
            muted ? 'text-white/50' : 'text-white/70',
          ].join(' ')}
        >
          {String(value)}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            title={tCommon('copy')}
            aria-label={tCommon('copy')}
            className="inline-flex items-center justify-center rounded p-1 text-white/30 transition-colors hover:text-white/75 focus:outline-none shrink-0"
          >
            {copied ? (
              <Check size={11} className="text-emerald-400" />
            ) : (
              <Copy size={11} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function SectionHeading({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`mb-3 text-[9px] uppercase tracking-[0.13em] text-white/40 ${className}`}>
      {children}
    </p>
  );
}
