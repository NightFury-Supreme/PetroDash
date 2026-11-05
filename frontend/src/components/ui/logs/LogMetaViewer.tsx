import React from 'react';
import { useMessages } from 'next-intl';
import { isDiffValue, isLegacyDiffString, isEntityId } from './logHelpers';
import { resolveFieldLabel, formatMetaValue } from './logFormatters';
import { DiffPills, SectionHeading } from './LogInfoRow';
import type { DiffValue } from './logTypes';

export { DiffPills, InfoRow, SectionHeading } from './LogInfoRow';

type TranslationFn = { (key: string): string; has: (key: string) => boolean };

export function DiffViewer({
  data,
  prefix = '',
  tCommon,
}: {
  data: Record<string, unknown>;
  prefix?: string;
  tCommon: TranslationFn;
}) {
  const messages = useMessages() as Record<string, unknown> | undefined;

  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (
          key === 'actorRole' ||
          key === 'actorUsername' ||
          key === 'actorId' ||
          key === 'adminRole' ||
          key === 'adminUsername' ||
          key === 'adminId' ||
          key === 'performedByStaff' ||
          key === 'suspendedByAdmin' ||
          key === 'password' ||
          key === 'currentPassword' ||
          key === 'newPassword' ||
          key === 'confirmPassword'
        ) {
          return null;
        }
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const displayKey = resolveFieldLabel(messages, fullKey);

        if (isDiffValue(value)) {
          return (
            <div
              key={fullKey}
              className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0"
            >
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">
                {displayKey}
              </span>
              <DiffPills
                oldVal={formatMetaValue(fullKey, String(value.old ?? '-'), messages)}
                newVal={formatMetaValue(fullKey, String(value.new ?? '-'), messages)}
              />
            </div>
          );
        }

        if (isLegacyDiffString(value)) {
          const [oldVal, newVal] = value.split('->').map((s) => s.trim());
          return (
            <div
              key={fullKey}
              className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0"
            >
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">
                {displayKey}
              </span>
              <DiffPills
                oldVal={formatMetaValue(fullKey, oldVal || '-', messages)}
                newVal={formatMetaValue(fullKey, newVal || '-', messages)}
              />
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

export function CreatedViewer({
  data,
  prefix = '',
}: {
  data: Record<string, unknown>;
  prefix?: string;
  tCommon?: TranslationFn;
}) {
  const messages = useMessages() as Record<string, unknown> | undefined;

  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (
          key === 'actorRole' ||
          key === 'actorUsername' ||
          key === 'actorId' ||
          key === 'adminRole' ||
          key === 'adminUsername' ||
          key === 'adminId' ||
          key === 'performedByStaff' ||
          key === 'suspendedByAdmin' ||
          key === 'password' ||
          key === 'currentPassword' ||
          key === 'newPassword' ||
          key === 'confirmPassword'
        ) {
          return null;
        }
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const displayLabel = resolveFieldLabel(messages, key);

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return (
            <CreatedViewer
              key={fullKey}
              data={value as Record<string, unknown>}
              prefix={fullKey}
            />
          );
        }

        const rawStr = typeof value === 'string' ? value : String(value ?? '');

        return (
          <div
            key={fullKey}
            className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0"
          >
            <span className="font-sans text-[10px] text-white/50 shrink-0 truncate">
              {displayLabel}
            </span>
            <span className="font-mono text-[11px] text-emerald-400/70 break-all ml-auto text-right">
              {formatMetaValue(key, rawStr, messages)}
            </span>
          </div>
        );
      })}
    </>
  );
}

export function MetaViewer({
  data,
  tCommon,
}: {
  data: Record<string, unknown>;
  tCommon: TranslationFn;
}) {
  const messages = useMessages() as Record<string, unknown> | undefined;
  const commonMessages = messages?.Common as Record<string, unknown> | undefined;

  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (
          key === 'actorRole' ||
          key === 'actorUsername' ||
          key === 'actorId' ||
          key === 'adminRole' ||
          key === 'adminUsername' ||
          key === 'adminId' ||
          key === 'performedByStaff' ||
          key === 'suspendedByAdmin' ||
          key === 'password' ||
          key === 'currentPassword' ||
          key === 'newPassword' ||
          key === 'confirmPassword'
        ) {
          return null;
        }
        const label = resolveFieldLabel(messages, key);

        if (isDiffValue(value)) {
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 py-[7px] border-b border-white/[0.04] last:border-0"
            >
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">{label}</span>
              <DiffPills
                oldVal={formatMetaValue(key, String((value as DiffValue).old ?? '—'), messages)}
                newVal={formatMetaValue(key, String((value as DiffValue).new ?? '—'), messages)}
              />
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
            <div
              key={key}
              className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0"
            >
              <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">
                {label}
              </span>
              <span className="text-right text-[11px] text-white/60 break-all">
                {(value as unknown[]).join(', ') || '—'}
              </span>
            </div>
          );
        }

        if (typeof value === 'boolean') {
          const yesLabel =
            typeof commonMessages?.yes === 'string' ? (commonMessages.yes as string) : 'Yes';
          const noLabel =
            typeof commonMessages?.no === 'string' ? (commonMessages.no as string) : 'No';
          return (
            <div
              key={key}
              className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0"
            >
              <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">
                {label}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  value ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {value ? yesLabel : noLabel}
              </span>
            </div>
          );
        }

        if (value === null || value === undefined) return null;

        const str = String(value);

        if (isLegacyDiffString(str)) {
          const idx = str.indexOf('->');
          const oldVal = str.slice(0, idx).trim();
          const newVal = str.slice(idx + 2).trim();
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 py-[7px] border-b border-white/[0.04] last:border-0"
            >
              <span className="font-sans text-[10px] text-white/55 shrink-0 truncate">{label}</span>
              <DiffPills
                oldVal={formatMetaValue(key, oldVal, messages)}
                newVal={formatMetaValue(key, newVal, messages)}
              />
            </div>
          );
        }

        const isMono = isEntityId(str);
        const formattedVal = formatMetaValue(key, str, messages);

        return (
          <div
            key={key}
            className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0"
          >
            <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">
              {label}
            </span>
            <span
              className={`text-right break-all text-[11px] ${
                isMono ? 'font-mono text-white/50' : 'text-white/70'
              }`}
            >
              {formattedVal}
            </span>
          </div>
        );
      })}
    </>
  );
}
