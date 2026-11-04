'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Laptop } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { AdminUserSessionsSkeleton } from '@/components/skeletons/admin/user/tabs';
import { useAdminUserSessions } from '@/hooks/admin/users/useAdminUserSessions';
import { AdminSessionRow } from './AdminSessionRow';
import type { AdminUserSession } from '@/hooks/admin/users/types';

interface SessionsTabProps {
  userId: string;
  username?: string;
}

export function SessionsTab({ userId }: SessionsTabProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showSuccess, showError } = useToast();

  const {
    sessions,
    loading,
    revokingId,
    fetchSessions,
    revokeSession,
  } = useAdminUserSessions(userId);

  const [sessionToRevoke, setSessionToRevoke] = useState<AdminUserSession | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleConfirmRevokeSingle = async () => {
    if (!sessionToRevoke) return;
    const res = await revokeSession(sessionToRevoke.id);
    if (res.success) {
      showSuccess(t('sessionRevoked'));
      setSessionToRevoke(null);
    } else {
      const err = res.error || 'ERR_REVOKE_SESSION_FAILED';
      showError(tErrorBackend.has(err) ? tErrorBackend(err) : err);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('activeSessions')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('activeSessionsDesc')}</p>
          </div>
        </div>

        {loading ? (
          <AdminUserSessionsSkeleton />
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <Laptop size={28} className="mb-3 text-white/40" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-white/90">{t('noActiveSessions')}</p>
            <p className="mt-1 text-xs text-white/40">{t('noActiveSessionsDesc')}</p>
          </div>
        ) : (
          <>
            <div className="hidden gap-4 grid-cols-[1fr_220px_72px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/40 md:grid">
              <span>{tCommon('device')}</span>
              <span className="md:text-right">{tCommon('location')}</span>
              <span className="text-right">{tCommon('actions')}</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {sessions.map((session, index) => {
                const rowId = session.id || session.ip || String(index);
                return (
                  <AdminSessionRow
                    key={rowId}
                    session={session}
                    onRevoke={() => setSessionToRevoke(session)}
                    isRevoking={revokingId === session.id}
                    disabled={Boolean(revokingId)}
                    isExpanded={expandedId === rowId}
                    onToggle={() => toggleExpand(rowId)}
                  />
                );
              })}
            </div>
          </>
        )}
      </section>

      <DeleteDrawer
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleConfirmRevokeSingle}
        entityType={t('revokeSingleTitle')}
        entityName={sessionToRevoke?.device || ''}
        entitySubText={[sessionToRevoke?.browser, sessionToRevoke?.ip].filter(Boolean).join(' • ')}
        warningPoints={[
          t('revokeSingleWarning1'),
        ]}
        requireConfirmText={false}
      />
    </div>
  );
}

export default SessionsTab;
