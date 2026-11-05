import React from 'react';
import { useTranslations, useFormatter, useMessages } from 'next-intl';
import type { LogEntry, LogMeta, Variant } from './logTypes';
import {
  META_SYSTEM_KEYS,
  cleanIp,
  parseUserAgent,
  resolveCategoryTranslation,
  resolveResourceDisplays,
  resolveStaffPerformedBy,
  formatReason,
  formatBanDuration,
  formatSuspendDuration,
} from './logHelpers';
import {
  SectionHeading,
  InfoRow,
  DiffViewer,
  CreatedViewer,
  MetaViewer,
} from './LogMetaViewer';
import { StatusBadge } from './LogStatusBadge';
import { ActionCell } from './LogActionCell';

export { StatusBadge, ActionCell };

export function ExpandedPanel({
  log,
  variant,
  meta,
}: {
  log: LogEntry;
  variant: Variant;
  meta: LogMeta;
}) {
  const t = useTranslations('UI');
  const tCommon = useTranslations('Common');
  const format = useFormatter();
  const messages = useMessages() as Record<string, unknown> | undefined;
  const uiMessages = messages?.UI as Record<string, unknown> | undefined;
  const reasonsMessages = (messages?.ActivityLog as Record<string, unknown> | undefined)?.reasons as
    | Record<string, unknown>
    | undefined;

  const hasChanges = meta.changes != null && Object.keys(meta.changes).length > 0;
  const hasChangedLegacy = meta.changed != null && Object.keys(meta.changed).length > 0;
  const hasCreated = meta.created != null && Object.keys(meta.created).length > 0;

  const rawMeta = Object.fromEntries(
    Object.entries(meta).filter(([k, v]) => {
      if (META_SYSTEM_KEYS.has(k)) return false;
      if (k === 'emailOrUsername' && (v === meta.username || v === meta.email)) return false;
      return true;
    })
  );
  const hasRawMeta = Object.keys(rawMeta).length > 0;

  const isStaff = log.actorType === 'staff';
  const isSystem = log.actorType === 'system';
  const isSelf = log.actorType === 'self' || (!isStaff && !isSystem);
  const performedByValue = resolveStaffPerformedBy(log, meta, tCommon);

  const ip = cleanIp((log.ip ?? meta.ip) as string | null | undefined);
  const statusCode = log.statusCode ?? meta.statusCode;

  const canShowNetwork = variant === 'admin' || isSelf;
  const ipDisplay = canShowNetwork && ip ? ip : null;

  const canShowSession =
    variant === 'admin'
      ? Boolean(log.sessionId || meta.sessionId)
      : Boolean(isSelf && (log.sessionId || meta.sessionId));
  const sessionIdValue = (log.sessionId ?? meta.sessionId) as string | null | undefined;

  const uaDisplay =
    canShowNetwork && (log.userAgent || meta.userAgent)
      ? parseUserAgent((log.userAgent ?? meta.userAgent) as string, tCommon('unknown'))
      : null;

  const rawLocation = (log.location || meta.location) as string | null | undefined;
  const isLocalOrUnknown = !rawLocation || rawLocation === 'Unknown Location';
  const locationDisplay = canShowNetwork && !isLocalOrUnknown ? rawLocation : null;

  const isBanAction = log.action === 'admin.user.ban';
  const isUnbanAction = log.action === 'admin.user.unban';
  const isSuspendAction =
    log.action === 'server.suspend' ||
    log.action === 'admin.server.suspend' ||
    log.action === 'server.compliance.suspended';

  const banDuration = isBanAction ? formatBanDuration(meta, tCommon) : null;
  const banUntilFormatted =
    isBanAction && meta.banUntil
      ? format.dateTime(new Date(meta.banUntil as string), {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;

  const suspendDuration = isSuspendAction
    ? formatSuspendDuration(meta, log.createdAt, tCommon)
    : null;
  const suspendUntilFormatted =
    isSuspendAction && meta.suspendedUntil
      ? format.dateTime(new Date(meta.suspendedUntil as string), {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;

  const {
    serverDisplay,
    ticketDisplay,
    planDisplay,
    itemDisplay,
    codeDisplay,
  } = resolveResourceDisplays(log, meta);

  const suspensionHeading = tCommon.has('suspensionDetails')
    ? tCommon('suspensionDetails')
    : (t.has('suspensionDetails') ? t('suspensionDetails') : 'Suspension Details');
  const banHeading = tCommon.has('banDetails')
    ? tCommon('banDetails')
    : (t.has('banDetails') ? t('banDetails') : 'Ban Details');
  const targetUserHeading = tCommon.has('targetUser')
    ? tCommon('targetUser')
    : (t.has('targetUser') ? t('targetUser') : 'Target User');

  return (
    <div className="px-5 pt-3 pb-7 border-b border-white/[0.05] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 w-full min-w-0">
        <div>
          <SectionHeading>{t('requestInformation')}</SectionHeading>
          <InfoRow label={t('requestId')} value={log.id} mono muted copyable />
          {variant === 'admin' ? (
            (log.actorUsername || log.actorId) && (
              <InfoRow
                label={tCommon('performedBy')}
                value={log.actorUsername || String(log.actorId)}
              />
            )
          ) : isStaff ? (
            <InfoRow
              label={tCommon('performedBy')}
              value={performedByValue}
            />
          ) : isSystem ? (
            <InfoRow
              label={tCommon('performedBy')}
              value={tCommon('system')}
            />
          ) : null}
          {canShowSession && (
            <InfoRow label={t('sessionId')} value={sessionIdValue} mono muted />
          )}
          {ipDisplay && (
            <InfoRow label={t('ipAddress')} value={ipDisplay} mono />
          )}
          {locationDisplay && <InfoRow label={tCommon('location')} value={locationDisplay} />}
          {uaDisplay && <InfoRow label={t('device')} value={uaDisplay} />}
          {serverDisplay && (
            <InfoRow label={tCommon('server')} value={serverDisplay} mono muted />
          )}
          {ticketDisplay && (
            <InfoRow label={tCommon('ticket')} value={ticketDisplay} mono muted />
          )}
          {planDisplay && (
            <InfoRow label={tCommon('plan')} value={planDisplay} />
          )}
          {itemDisplay && (
            <InfoRow label={tCommon('item')} value={itemDisplay} />
          )}
          {codeDisplay && (
            <InfoRow label={tCommon('code')} value={codeDisplay} mono />
          )}
          {log.category && (
            <InfoRow
              label={t('category')}
              value={resolveCategoryTranslation(log.category, uiMessages)}
            />
          )}
          {variant === 'admin' && log.method && <InfoRow label={t('method')} value={log.method} />}
          {variant === 'admin' && log.path && (
            <InfoRow label={t('path')} value={log.path} mono muted />
          )}
          {variant === 'admin' && log.resourceType && !serverDisplay && !ticketDisplay && (
            <InfoRow
              label={log.resourceType === 'user' ? targetUserHeading : t('resource')}
              value={
                log.resourceId
                  ? meta.targetName
                    ? `${meta.targetName} (${log.resourceId})`
                    : log.resourceId
                  : log.resourceType
              }
              mono
              muted
            />
          )}
          {variant === 'admin' && statusCode != null && (
            <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">
                {t('statusCode')}
              </span>
              <span
                className={`font-mono text-[11px] ${
                  statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {statusCode}
              </span>
            </div>
          )}

          {meta.reason && !isBanAction && !isSuspendAction && (
            <InfoRow
              label={tCommon('reason')}
              value={formatReason(meta.reason as string, reasonsMessages)}
            />
          )}

          {(isBanAction || isUnbanAction) && (meta.targetUsername || meta.targetEmail) && (
            <>
              <SectionHeading className="mt-4">{targetUserHeading}</SectionHeading>
              {meta.targetUsername && (
                <InfoRow label={tCommon('username')} value={meta.targetUsername as string} />
              )}
              {meta.targetEmail && (
                <InfoRow label={tCommon('email')} value={meta.targetEmail as string} muted />
              )}
            </>
          )}

          {isBanAction && (
            <>
              <SectionHeading className="mt-4">{banHeading}</SectionHeading>
              {meta.reason && (
                <InfoRow
                  label={tCommon('reason')}
                  value={formatReason(meta.reason as string, reasonsMessages)}
                />
              )}
              {banDuration && <InfoRow label={tCommon('duration')} value={banDuration} />}
              {banUntilFormatted && (
                <InfoRow label={tCommon('expiresAt')} value={banUntilFormatted} />
              )}
            </>
          )}

          {isSuspendAction && (
            <>
              <SectionHeading className="mt-4">{suspensionHeading}</SectionHeading>
              {meta.reason && (
                <InfoRow
                  label={tCommon('reason')}
                  value={formatReason(meta.reason as string, reasonsMessages)}
                />
              )}
              {suspendDuration && <InfoRow label={tCommon('duration')} value={suspendDuration} />}
              {suspendUntilFormatted && (
                <InfoRow label={tCommon('expiresAt')} value={suspendUntilFormatted} />
              )}
            </>
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
