import React from 'react';
import { Link } from '@/i18n/routing';
import { RankBadge } from '@/components/ui/RankBadge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { getCategoryLabel, getActionLabel } from '@/config/field-labels';
import { useTranslations } from 'next-intl';
import type { LogEntry, LogMeta, Variant } from './logTypes';
import { META_SYSTEM_KEYS, CONTEXT_META_KEYS, CONTEXT_LABELS, parseUserAgent } from './logHelpers';
import {
  SectionHeading,
  InfoRow,
  DiffViewer,
  CreatedViewer,
  MetaViewer,
} from './LogMetaViewer';

export function StatusBadge({ log }: { log: LogEntry }) {
  const tCommon = useTranslations('Common');

  if (log.success !== undefined) {
    return (
      <StatusIndicator
        status={log.success ? 'success' : 'failed'}
        label={log.success ? tCommon('success') : tCommon('failed')}
      />
    );
  }

  let statusKey = 'info';
  let label = tCommon('info');
  switch (log.severity) {
    case 'CRITICAL':
    case 'error':
    case 'ERROR':
      statusKey = 'error';
      label = log.severity === 'CRITICAL' ? tCommon('critical') : tCommon('error');
      break;
    case 'WARNING':
    case 'warning':
      statusKey = 'warning';
      label = tCommon('warning');
      break;
    case 'INFO':
    case 'info':
    default:
      statusKey = 'info';
      label = tCommon('info');
      break;
  }

  return <StatusIndicator status={statusKey} label={label} />;
}

export function ActionCell({ log, variant, meta }: { log: LogEntry; variant: Variant; meta: LogMeta }) {
  const tActivity = useTranslations('ActivityLog');
  const tCommon = useTranslations('Common');
  
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
            <span className="text-[10px] text-white/35">{tCommon('system')}</span>
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
                    : `${log.resourceType === 'user' ? tCommon('user') : log.resourceType === 'server' ? tCommon('server') : tCommon('ticket')} ${log.resourceId.slice(-6)}`}
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
  if (ctxKey === 'serverName' || ctxKey === 'name') translatedCtxLabel = tCommon('server');
  if (ctxKey === 'planName' || ctxKey === 'plan') translatedCtxLabel = tCommon('plan');
  if (ctxKey === 'subject' || ctxKey === 'ticketTitle') translatedCtxLabel = tCommon('ticket');
  if (ctxKey === 'itemName') translatedCtxLabel = tCommon('item');
  if (ctxKey === 'code') translatedCtxLabel = tCommon('code');
  if (ctxKey === 'reason') translatedCtxLabel = tCommon('reason');

  const ctx = ctxKey ? `${translatedCtxLabel}: ${meta[ctxKey]}` : null;

  const adminName = (meta.adminUsername as string) || (log.action.startsWith('admin.') ? log.actorUsername : null);
  const adminRole = (meta.adminRole as string) || (log.action.startsWith('admin.') ? log.actorRole : 'admin') || 'admin';
  const isByAdmin = Boolean(
    adminName || 
    meta.performedByAdmin || 
    meta.updatedByAdmin || 
    meta.clearedByAdmin || 
    meta.deletedByAdmin || 
    log.action.startsWith('admin.')
  );

  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-white truncate">
        {actionLabel}
      </div>
      {isByAdmin && (
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/40">{tCommon('by')}</span>
          <span className="text-[10px] text-[#ff5722] font-medium truncate">
            {adminName || tCommon('admin')}
          </span>
          <RankBadge rank={adminRole} size="sm" />
        </div>
      )}
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

  const adminName = (meta.adminUsername as string) || (log.action.startsWith('admin.') ? log.actorUsername : null);
  const adminRole = (meta.adminRole as string) || (log.action.startsWith('admin.') ? log.actorRole : 'admin') || 'admin';
  const isByAdmin = Boolean(
    adminName || 
    meta.performedByAdmin || 
    meta.updatedByAdmin || 
    meta.clearedByAdmin || 
    meta.deletedByAdmin || 
    log.action.startsWith('admin.')
  );

  const rawIp      = log.ip ?? meta.ip;
  const ip         = rawIp === '::1' ? '127.0.0.1' : (typeof rawIp === 'string' && rawIp.startsWith('::ffff:') ? rawIp.replace('::ffff:', '') : rawIp);
  const statusCode = log.statusCode ?? meta.statusCode;
  const ipDisplay  = ip ? ip : (isByAdmin && variant === 'user' ? tCommon('protected') : '-');

  const canShowSession = (!isByAdmin || variant === 'admin') && Boolean(log.sessionId || meta.sessionId || (variant === 'admin' && meta.adminSessionId));
  const sessionIdValue = (log.sessionId ?? meta.sessionId ?? (variant === 'admin' ? meta.adminSessionId : null)) as string | null | undefined;
  const uaDisplay      = (!isByAdmin || variant === 'admin') && (log.userAgent || meta.userAgent)
    ? parseUserAgent((log.userAgent ?? meta.userAgent) as string, tCommon('unknown'))
    : null;

  return (
    <div className="px-5 pt-3 pb-7 border-b border-white/[0.05] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 w-full min-w-0">

        <div>
          <SectionHeading>{t('requestInformation')}</SectionHeading>
          <InfoRow label={t('requestId')} value={log._id} mono muted />
          {isByAdmin && (
            <InfoRow
              label={tCommon('performedBy')}
              value={adminName ? `${adminName} (${adminRole})` : tCommon('admin')}
            />
          )}
          {canShowSession && (
            <InfoRow
              label={t('sessionId')}
              value={sessionIdValue}
              mono
              muted
            />
          )}
          <InfoRow label={t('ipAddress')} value={ipDisplay} mono />
          {uaDisplay && <InfoRow label={tCommon('device')} value={uaDisplay} />}
          {log.category    && <InfoRow label={t('category')} value={getCategoryLabel(log.category)} />}
          {variant === 'admin' && log.method && <InfoRow label={t('method')} value={log.method} />}
          {variant === 'admin' && log.path && <InfoRow label={t('path')} value={log.path} mono muted />}
          {variant === 'admin' && log.resourceType && (
            <InfoRow
              label={log.resourceType === 'user' ? t('targetUser') : log.resourceType === 'server' ? t('targetServer') : log.resourceType === 'ticket' ? t('targetTicket') : t('resource')}
              value={log.resourceId ? (meta.targetName ? `${meta.targetName} (${log.resourceId})` : log.resourceId) : log.resourceType}
              mono
              muted
            />
          )}
          {variant === 'admin' && statusCode != null && (
            <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">{t('statusCode')}</span>
              <span className={`font-mono text-[11px] ${statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                {statusCode}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-5 min-w-0">
          {hasChanges && (
            <div>
              <SectionHeading>{t('valueChanges')}</SectionHeading>
              <DiffViewer data={meta.changes as Record<string, unknown>} tCommon={tCommon} />
            </div>
          )}
          {hasChangedLegacy && (
            <div>
              <SectionHeading>{t('changed')}</SectionHeading>
              <DiffViewer data={meta.changed as Record<string, unknown>} tCommon={tCommon} />
            </div>
          )}
          {hasCreated && (
            <div>
              <SectionHeading>{t('created')}</SectionHeading>
              <CreatedViewer data={meta.created as Record<string, unknown>} tCommon={tCommon} />
            </div>
          )}
          {hasRawMeta && (
            <div>
              <SectionHeading>{t('additionalInfo')}</SectionHeading>
              <MetaViewer data={rawMeta} tCommon={tCommon} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
