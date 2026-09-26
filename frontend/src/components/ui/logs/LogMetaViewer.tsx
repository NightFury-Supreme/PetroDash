import React from 'react';
import { getFieldLabel } from '@/config/field-labels';
import { isDiffValue, isLegacyDiffString, isMongoId } from './logHelpers';
import type { DiffValue } from './logTypes';

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
  mono  = false,
  muted = false,
}: {
  label: string;
  value?: string | number | null;
  mono?:  boolean;
  muted?: boolean;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
      <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">
        {label}
      </span>
      <span
        className={[
          'text-right break-all text-[11px]',
          mono  ? 'font-mono' : '',
          muted ? 'text-white/50' : 'text-white/70',
        ].join(' ')}
      >
        {String(value)}
      </span>
    </div>
  );
}

export function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mb-3 text-[9px] uppercase tracking-[0.13em] text-white/40 ${className}`}>
      {children}
    </p>
  );
}

export function DiffViewer({ data, prefix = '', tCommon }: { data: Record<string, unknown>; prefix?: string; tCommon: any }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const fallbackLabel = getFieldLabel(fullKey);
        const translateKey = key === 'code' ? 'referralCode' : key;
        const displayKey = (tCommon && tCommon.has(translateKey)) ? tCommon(translateKey) : fallbackLabel;

        if (isDiffValue(value)) {
          return (
            <div key={fullKey} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">{displayKey}</span>
              <DiffPills oldVal={String(value.old ?? '-')} newVal={String(value.new ?? '-')} />
            </div>
          );
        }

        if (isLegacyDiffString(value)) {
          const [oldVal, newVal] = value.split('->').map(s => s.trim());
          return (
            <div key={fullKey} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">{displayKey}</span>
              <DiffPills oldVal={oldVal || '-'} newVal={newVal || '-'} />
            </div>
          );
        }

        if (typeof value === 'object' && value !== null) {
          return (
            <DiffViewer
              key={fullKey}
              data={value as Record<string, unknown>}
              prefix={fullKey}
              tCommon={tCommon}
            />
          );
        }

        return null;
      })}
    </>
  );
}

export function CreatedViewer({ data, tCommon }: { data: Record<string, unknown>; tCommon: any }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const fallbackLabel = getFieldLabel(key);
        const translateKey = key === 'code' ? 'referralCode' : key;
        const displayLabel = (tCommon && tCommon.has(translateKey)) ? tCommon(translateKey) : fallbackLabel;
        
        return (
          <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
            <span className="font-sans text-[10px] text-white/50 shrink-0 truncate">
              {displayLabel}
            </span>
            <span className="font-mono text-[11px] text-emerald-400/70 break-all ml-auto text-right">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </span>
          </div>
        );
      })}
    </>
  );
}

export function MetaViewer({ data, tCommon }: { data: Record<string, unknown>; tCommon: any }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const fallbackLabel = getFieldLabel(key);
        const translateKey = key === 'code' ? 'referralCode' : key;
        const label = (tCommon && tCommon.has(translateKey)) ? tCommon(translateKey) : fallbackLabel;

        if (isDiffValue(value)) {
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">{label}</span>
              <DiffPills oldVal={String((value as DiffValue).old ?? '—')} newVal={String((value as DiffValue).new ?? '—')} />
            </div>
          );
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return (
            <div key={key} className="mt-4 first:mt-0">
              <SectionHeading>{label}</SectionHeading>
              <div className="pl-2 border-l border-white/[0.06]">
                <MetaViewer data={value as Record<string, unknown>} tCommon={tCommon} />
              </div>
            </div>
          );
        }

        if (Array.isArray(value)) {
          return (
            <div key={key} className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">{label}</span>
              <span className="text-right text-[11px] text-white/60 break-all">
                {(value as unknown[]).join(', ') || '—'}
              </span>
            </div>
          );
        }

        if (typeof value === 'boolean') {
          return (
            <div key={key} className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">{label}</span>
              <span className={`text-[11px] font-medium ${value ? 'text-emerald-400' : 'text-red-400'}`}>
                {value ? 'Yes' : 'No'}
              </span>
            </div>
          );
        }

        if (value === null || value === undefined) return null;

        const str = String(value);

        if (isLegacyDiffString(str)) {
          const idx    = str.indexOf('->');
          const oldVal = str.slice(0, idx).trim();
          const newVal = str.slice(idx + 2).trim();
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">{label}</span>
              <DiffPills oldVal={oldVal} newVal={newVal} />
            </div>
          );
        }

        const isMono = isMongoId(str);

        return (
          <div key={key} className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
            <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">{label}</span>
            <span className={`text-right break-all text-[11px] ${isMono ? 'font-mono text-white/50' : 'text-white/70'}`}>
              {str}
            </span>
          </div>
        );
      })}
    </>
  );
}
