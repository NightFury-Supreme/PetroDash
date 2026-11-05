import React from 'react';
import { useTranslations, useMessages } from 'next-intl';
import { Link } from '@/i18n/routing';
import { RankBadge } from '@/components/ui/RankBadge';
import type { LogEntry, LogMeta, Variant } from './logTypes';
import { CONTEXT_META_KEYS, formatKeyToLabel, formatReason } from './logHelpers';

function resolveMsgLeaf(root: unknown, parts: string[]): string | undefined {
  let node: unknown = root;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

export function resolveActionLabel(log: LogEntry, activityMessages: unknown): string {
  const action = log.action;
  if (!action) return '';

  const normalizedAction =
    action === 'system.server.auto_unsuspend' || action === 'server.auto_unsuspend'
      ? 'server.unsuspend'
      : action === 'system.compliance.suspend'
        ? 'server.compliance.suspended'
        : action;
  const parts = normalizedAction.split('.');

  const direct = resolveMsgLeaf(activityMessages, parts);
  if (direct !== undefined) return direct;

  if (activityMessages && typeof activityMessages === 'object') {
    let node: unknown = activityMessages;
    for (const part of parts) {
      if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[part];
      } else {
        node = undefined;
        break;
      }
    }

    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;

      const candidates: string[] =
        log.success === false
          ? ['failed', 'error', 'success', 'default', 'enable', 'update']
          : ['success', 'default', 'enable', 'update', 'failed'];

      for (const candidate of candidates) {
        if (typeof obj[candidate] === 'string') {
          return obj[candidate] as string;
        }
      }
    }
  }

  return action
    .split('.')
    .map((segment) => formatKeyToLabel(segment))
    .join(' ');
}

export function ActionCell({
  log,
  variant,
  meta,
}: {
  log: LogEntry;
  variant: Variant;
  meta: LogMeta;
}) {
  const tCommon = useTranslations('Common');
  const messages = useMessages() as Record<string, unknown> | undefined;
  const reasonsMessages = (messages?.ActivityLog as Record<string, unknown> | undefined)?.reasons as
    | Record<string, unknown>
    | undefined;

  const actionLabel = resolveActionLabel(log, messages?.ActivityLog);

  if (variant === 'admin') {
    const hasTarget = Boolean(
      log.resourceId &&
        (log.resourceType === 'user' ||
          log.resourceType === 'server' ||
          log.resourceType === 'ticket')
    );

    return (
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white truncate">{actionLabel}</div>
        {hasTarget && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Link
              href={`/admin/${log.resourceType}s/${log.resourceId}`}
              className="text-[10px] text-white/50 hover:text-emerald-400 transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {meta.targetName
                ? String(meta.targetName)
                : `${
                    log.resourceType === 'user'
                      ? tCommon('user')
                      : log.resourceType === 'server'
                        ? tCommon('server')
                        : tCommon('ticket')
                  } ${log.resourceId!.slice(-6)}`}
            </Link>
            {log.resourceType === 'user' && Boolean(meta.targetRole) && (
              <RankBadge rank={meta.targetRole as string} size="sm" />
            )}
          </div>
        )}
      </div>
    );
  }

  const ctxKey = CONTEXT_META_KEYS.find((k) => meta[k]);

  let translatedCtxLabel: string | null = null;
  if (ctxKey === 'serverName' || ctxKey === 'name') translatedCtxLabel = tCommon('server');
  else if (ctxKey === 'planName' || ctxKey === 'plan') translatedCtxLabel = tCommon('plan');
  else if (ctxKey === 'subject' || ctxKey === 'ticketTitle') translatedCtxLabel = tCommon('ticket');
  else if (ctxKey === 'itemName') translatedCtxLabel = tCommon('item');
  else if (ctxKey === 'code') translatedCtxLabel = tCommon('code');
  else if (ctxKey === 'reason') translatedCtxLabel = tCommon('reason');

  const rawCtxVal = ctxKey ? meta[ctxKey] : null;
  const ctxValDisplay =
    ctxKey === 'reason' && typeof rawCtxVal === 'string'
      ? formatReason(rawCtxVal, reasonsMessages)
      : rawCtxVal;
  const ctx = ctxKey && translatedCtxLabel ? `${translatedCtxLabel}: ${ctxValDisplay}` : null;

  const isStaff = log.actorType === 'staff';
  const isSystem = log.actorType === 'system';
  const staffName =
    (log.actorUsername && log.actorUsername !== 'system' ? log.actorUsername : null) ||
    (meta.adminUsername as string) ||
    null;
  const staffRole =
    (log.actorRole && log.actorRole !== 'system' ? log.actorRole : null) ||
    (meta.adminRole as string) ||
    'admin';
  const hasDistinctStaffName = Boolean(
    staffName &&
      staffName.toLowerCase() !== staffRole.toLowerCase() &&
      staffName.toLowerCase() !== 'admin' &&
      staffName.toLowerCase() !== 'system'
  );

  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-white truncate">{actionLabel}</div>
      {isStaff ? (
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/40">{tCommon('by')}</span>
          {hasDistinctStaffName ? (
            <span className="text-[10px] text-[#ff5722] font-semibold truncate">
              {staffName}
            </span>
          ) : (
            <RankBadge rank={staffRole} size="sm" />
          )}
        </div>
      ) : isSystem ? (
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/40">{tCommon('by')}</span>
          <span className="text-[10px] text-emerald-400 font-medium truncate">
            {tCommon('system')}
          </span>
        </div>
      ) : null}
      {ctx && <div className="mt-0.5 text-[10px] text-white/45 truncate">{ctx as string}</div>}
      {meta.reason && ctxKey !== 'reason' && (
        <div className="mt-0.5 text-[10px] text-white/40 truncate">
          {tCommon('reason')}: {formatReason(meta.reason as string, reasonsMessages)}
        </div>
      )}
    </div>
  );
}
