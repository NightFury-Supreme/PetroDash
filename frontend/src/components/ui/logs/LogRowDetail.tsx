import React from 'react';
import { Link } from '@/i18n/routing';
import { RankBadge } from '@/components/ui/RankBadge';
import { getCategoryLabel, getActionLabel } from '@/config/field-labels';
import { useTranslations } from 'next-intl';
import type { LogEntry, LogMeta, Variant } from './logTypes';
import { META_SYSTEM_KEYS, CONTEXT_META_KEYS, CONTEXT_LABELS } from './logHelpers';
import {
  SectionHeading,
  InfoRow,
  DiffViewer,
  CreatedViewer,
  MetaViewer,
} from './LogMetaViewer';

export function StatusBadge({ log }: { log: LogEntry }) {
  const tCommon = useTranslations('Common');
  type BadgeSpec = { dot: string; text: string; border: string; bg: string; pulse?: boolean };

  const badge = (spec: BadgeSpec, label: string) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded border
        ${spec.border} ${spec.bg} ${spec.text}
        text-[9px] font-semibold tracking-wider uppercase`}
    >
      <span className={`w-1 h-1 rounded-full ${spec.dot}${spec.pulse ? ' animate-pulse' : ''}`} />
      {label}
    </span>
  );

  if (log.success !== undefined) {
    return log.success
      ? badge({ dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.06]' }, tCommon('success') || 'SUCCESS')
      : badge({ dot: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-500/[0.06]'     }, tCommon('failed') || 'FAILED');
  }

  switch (log.severity) {
    case 'CRITICAL': return badge({ dot: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500/20',    bg: 'bg-red-500/[0.06]',    pulse: true }, tCommon('critical') || 'CRITICAL');
    case 'ERROR':    return badge({ dot: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/[0.06]' }, tCommon('error') || 'ERROR');
    case 'WARNING':  return badge({ dot: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.06]' }, tCommon('warning') || 'WARN');
    case 'error':    return badge({ dot: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500/20',    bg: 'bg-red-500/[0.06]' }, tCommon('error') || 'ERROR');
    case 'warning':  return badge({ dot: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-amber-500/20',  bg: 'bg-amber-500/[0.06]' }, tCommon('warning') || 'WARNING');
    case 'INFO':
    case 'info':
    default:         return badge({ dot: 'bg-sky-500',    text: 'text-sky-400',    border: 'border-sky-500/20',    bg: 'bg-sky-500/[0.06]' }, tCommon('info') || 'INFO');
  }
}

export function ActionCell({ log, variant, meta, tCommon }: { log: LogEntry; variant: Variant; meta: LogMeta; tCommon: any }) {
  const tActivity = useTranslations('ActivityLog');
  
  const actionLabel = tActivity.has(log.action) ? tActivity(log.action) : getActionLabel(log.action);
  
  if (variant === 'admin') {
    const actorId   = log.actorId ?? log.targetUserId ?? meta.userId;
    const actorName = log.actorUsername ?? meta.username ?? actorId;

    return (
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white truncate">
          {actionLabel}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {actorId ? (
            <Link
              href={`/admin/users/${actorId}`}
              className="text-[10px] text-white/50 hover:text-[#ff5722] transition-colors truncate"
              onClick={e => e.stopPropagation()}
            >
              {actorName as string}
            </Link>
          ) : (
            <span className="text-[10px] text-white/35">{tCommon('system') || 'System'}</span>
          )}
          <RankBadge
            rank={log.actorRole ?? 'system'}
            size="sm"
          />

          {log.resourceId && (log.resourceType === 'user' || log.resourceType === 'server' || log.resourceType === 'ticket') && (
            <>
              <span className="text-[10px] text-white/30 px-1">&rarr;</span>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/${log.resourceType}s/${log.resourceId}`}
                  className="text-[10px] text-white/50 hover:text-emerald-400 transition-colors truncate"
                  onClick={e => e.stopPropagation()}
                >
                  {meta.targetName 
                    ? String(meta.targetName) 
                    : `${log.resourceType === 'user' ? 'User' : log.resourceType === 'server' ? 'Server' : 'Ticket'} ${log.resourceId.slice(-6)}`}
                </Link>
                {log.resourceType === 'user' && Boolean(meta.targetRole) && (
                  <RankBadge rank={meta.targetRole as string} size="sm" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const ctxKey = CONTEXT_META_KEYS.find(k => meta[k]);
  
  let translatedCtxLabel = ctxKey ? CONTEXT_LABELS[ctxKey] : null;
  if (ctxKey === 'serverName') translatedCtxLabel = tCommon('server') || 'Server';
  if (ctxKey === 'planName') translatedCtxLabel = tCommon('plan') || 'Plan';
  if (ctxKey === 'subject') translatedCtxLabel = tCommon('ticket') || 'Ticket';
  if (ctxKey === 'itemName') translatedCtxLabel = tCommon('item') || 'Item';
  if (ctxKey === 'code') translatedCtxLabel = tCommon('code') || 'Code';

  const ctx = ctxKey ? `${translatedCtxLabel}: ${meta[ctxKey]}` : null;

  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-white truncate">
        {actionLabel}
      </div>
      {ctx && <div className="mt-0.5 text-[10px] text-white/45 truncate">{ctx as string}</div>}
    </div>
  );
}

export function ExpandedPanel({ log, variant, meta }: { log: LogEntry; variant: Variant; meta: LogMeta }) {
  const t = useTranslations('UI');
  const tCommon = useTranslations('Common');
  const hasChanges = meta.changes != null && Object.keys(meta.changes).length > 0;
  const hasChangedLegacy = meta.changed != null && Object.keys(meta.changed).length > 0;
  const hasCreated = meta.created != null && Object.keys(meta.created).length > 0;

  const rawMeta = Object.fromEntries(
    Object.entries(meta).filter(([k]) => !META_SYSTEM_KEYS.has(k))
  );
  const hasRawMeta = Object.keys(rawMeta).length > 0;

  const ip         = log.ip ?? meta.ip;
  const statusCode = log.statusCode ?? meta.statusCode;

  return (
    <div className="px-5 pt-3 pb-7 border-b border-white/[0.05] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 w-full min-w-0">

        <div>
          <SectionHeading>{t('requestInformation') || 'Request Information'}</SectionHeading>
          <InfoRow label={t('requestId') || "Request ID"} value={log._id} mono muted />
          <InfoRow label={t('sessionId') || "Session ID"} value={log.sessionId ?? meta.sessionId} mono muted />
          <InfoRow label={t('ipAddress') || "IP Address"} value={ip ?? '-'} mono />
          {log.category    && <InfoRow label={t('category') || "Category"} value={getCategoryLabel(log.category)} />}
          {log.method      && <InfoRow label={t('method') || "Method"} value={log.method} />}
          {log.path        && <InfoRow label={t('path') || "Path"} value={log.path} mono muted />}
          {variant === 'admin' && log.resourceType && (
            <InfoRow
              label={log.resourceType === 'user' ? (t('targetUser') || 'Target User') : log.resourceType === 'server' ? (t('targetServer') || 'Target Server') : log.resourceType === 'ticket' ? (t('targetTicket') || 'Target Ticket') : (t('resource') || 'Resource')}
              value={log.resourceId ? (meta.targetName ? `${meta.targetName} (${log.resourceId})` : log.resourceId) : log.resourceType}
              mono
              muted
            />
          )}
          {statusCode != null && (
            <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">{t('statusCode') || "Status Code"}</span>
              <span className={`font-mono text-[11px] ${statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                {statusCode}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-5 min-w-0">
          {hasChanges && (
            <div>
              <SectionHeading>{t('valueChanges') || "Value Changes"}</SectionHeading>
              <DiffViewer data={meta.changes as Record<string, unknown>} tCommon={tCommon} />
            </div>
          )}
          {hasChangedLegacy && (
            <div>
              <SectionHeading>{t('changed') || "Changed"}</SectionHeading>
              <DiffViewer data={meta.changed as Record<string, unknown>} tCommon={tCommon} />
            </div>
          )}
          {hasCreated && (
            <div>
              <SectionHeading>{t('created') || "Created"}</SectionHeading>
              <CreatedViewer data={meta.created as Record<string, unknown>} tCommon={tCommon} />
            </div>
          )}
          {variant === 'admin' && hasRawMeta && (
            <div>
              <SectionHeading>{t('additionalInfo') || "Additional Info"}</SectionHeading>
              <MetaViewer data={rawMeta} tCommon={tCommon} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
