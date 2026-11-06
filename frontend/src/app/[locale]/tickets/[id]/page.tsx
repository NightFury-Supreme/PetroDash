'use client';

import React, { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { useParams, Link } from "@/i18n/routing";
import { useTranslations, useFormatter } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
import { ErrorState, DashboardButton, GoBackButton } from '@/components/ui/ErrorState';

import {
  TicketDetailConversation,
  TicketDetailComposer,
  TicketDetailPanel,
  TicketDetailSkeleton,
} from '@/components/tickets/detail';

const EditServerDrawer = dynamic(
  () => import('@/components/server/EditServerDrawer').then((m) => m.EditServerDrawer),
  { ssr: false }
);

import { Priority } from '@/components/tickets/types';
import { shortId } from '@/components/tickets/utils';
import { useTicketDetail } from '@/hooks/tickets';

export default function TicketDetailPage() {
  const format = useFormatter();
  const t = useTranslations('Tickets');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const tErrorState = useTranslations('ErrorState');
  const { showError, showSuccess } = useToast();
  const { id } = useParams() as { id: string };

  const {
    ticket,
    messages,
    loading,
    error,
    hasMore,
    loadingMore,
    replying,
    statusBusy,
    loadMoreMessages,
    sendReply,
    updateStatus
  } = useTicketDetail(id);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [statusDone, setStatusDone] = useState<string | null>(null);

  const priorityMap: Record<string, { label: string; level: Priority }> = {
    low:    { label: t('priorities.low'), level: 'Low' },
    medium: { label: t('priorities.medium'), level: 'Medium' },
    high:   { label: t('priorities.high'), level: 'High' }
  };
  const priority = priorityMap[ticket?.priority || 'low'] || priorityMap.low;

  useEffect(() => {
    const handleResize = () => setDetailsOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = (instant = false) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: instant ? 'auto' : 'smooth',
      });
    }
  };

  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
      if (statusDoneTimeoutRef.current) clearTimeout(statusDoneTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !loadingMore) scrollToBottom();
  }, [messages.length, loadingMore]);

  const handleSendReply = async () => {
    if (!replyText.trim() || replying) return;
    const { ok, error: err } = await sendReply(replyText);
    if (ok) {
      setReplyText('');
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
      replyTimeoutRef.current = setTimeout(() => scrollToBottom(true), 0);
    } else if (err) {
      showError(err);
    }
  };

  const handleUpdateStatus = async (action: 'resolved' | 'reopen') => {
    setStatusDone(null);
    const { ok, error: err } = await updateStatus(action);
    if (ok) {
      const successMsg = action === 'resolved' ? t('ticketResolved') : t('ticketReopened');
      showSuccess(successMsg);
      setStatusDone(action);
      if (statusDoneTimeoutRef.current) clearTimeout(statusDoneTimeoutRef.current);
      statusDoneTimeoutRef.current = setTimeout(() => setStatusDone(null), 2000);
    } else {
      showError(err || (action === 'resolved' ? t('failedToResolve') : t('failedToReopen')));
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(shortId(id));
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSendReply(); }
  };

  if (loading) return <TicketDetailSkeleton />;
  
  if (error || !ticket) {
    const isForbidden = error === 'ERR_TICKET_FORBIDDEN';

    return (
      <ErrorState
        fullScreen={false}
        header={<React.Fragment />}
        showFooter={false}
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]"
            aria-hidden="true"
          >
            <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
            <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
            <path d="M6 6h.01" />
            <path d="M6 18h.01" />
            <path d="m13 6-4 6h6l-4 6" />
          </svg>
        }
        title={
          isForbidden
            ? (tErrorBackend.has('ERR_TICKET_FORBIDDEN') ? tErrorBackend('ERR_TICKET_FORBIDDEN') : tCommon('forbidden'))
            : tErrorState('pageNotFound')
        }
        description={
          <p>
            {isForbidden
              ? (tErrorBackend.has('ERR_TICKET_FORBIDDEN') ? tErrorBackend('ERR_TICKET_FORBIDDEN') : tCommon('forbidden'))
              : tErrorState('descNotFound', { topic: tCommon('ticket').toLowerCase() })}
          </p>
        }
        buttons={
          <>
            <DashboardButton />
            <Link
              href="/tickets"
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-[#D4D4D4] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              {t('backToTickets')}
            </Link>
            <GoBackButton />
          </>
        }
      />
    );
  }

  const status       = ticket.status;
  const replyAllowed = status === 'open' || status === 'pending';
  const username     = ticket.user?.username || ticket.user?.email || t('you');
  const createdDate  = format.dateTime(new Date(ticket.createdAt), {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const adminsInvolved = Array.from(new Set(
    messages
      .filter(m => (m.authorRole === 'admin' || m.isAdmin))
      .map(m => {
        const authorObj = m.author || (typeof m.userId === 'object' ? m.userId : null);
        return authorObj?.username || authorObj?.email || t('supportStaff');
      })
  ));
  const adminsText = adminsInvolved.length > 0 ? adminsInvolved.join(", ") : t('noneYet');

  return (
    <div className="flex-1 relative bg-[#0F0F0F]">
      <div className="absolute inset-0 pt-4 sm:pt-6 px-4 sm:px-6 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full space-y-6 min-h-0">
          
          <header className="border-b border-white/[0.06] pb-6 shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{ticket.title}</h1>
              <p className="text-[#888888] mt-1 text-sm">{t('ticketId')}{shortId(ticket.id)}</p>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
          
          <div className="flex-1 min-w-0 w-full flex flex-col min-h-0">
            <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
              
              <div 
                ref={scrollContainerRef} 
                className="p-6 flex-1 overflow-y-auto min-h-0"
              >
                <TicketDetailConversation
                  messages={messages}
                  username={username}
                  hasMore={hasMore}
                  isLoadingMore={loadingMore}
                  onLoadMore={loadMoreMessages}
                  onServerMentionClick={(id) => setEditServerId(id)}
                />
              </div>
              
              <div className="w-full shrink-0 px-6 pb-2 pt-0">
                <TicketDetailComposer
                  status={status}
                  replyText={replyText}
                  replying={replying}
                  statusBusy={statusBusy}
                  onTextChange={setReplyText}
                  onSend={() => void handleSendReply()}
                  onKeyDown={handleKeyDown}
                  onReopen={() => handleUpdateStatus('reopen')}
                />
              </div>
            </div>
          </div>
          
          {detailsOpen && (
            <div className="w-full lg:w-[380px] shrink-0 overflow-y-auto min-h-0 pr-2">
              <TicketDetailPanel
                ticketId={shortId(ticket.id)}
                status={status}
                category={ticket.category || t('general')}
                priority={priority.level}
                createdDate={createdDate}
                updatedAt={ticket.updatedAt}
                replyAllowed={replyAllowed}
                statusBusy={statusBusy}
                statusDone={statusDone as 'resolved' | 'reopen' | null}
                copied={copied}
                adminsInvolved={adminsText}
                onResolve={() => handleUpdateStatus('resolved')}
                onReopen={() => handleUpdateStatus('reopen')}
                onCopyId={copyId}
              />
            </div>
          )}
        </div>

      </div>

      {editServerId && (
        <EditServerDrawer
          serverId={editServerId}
          onClose={() => setEditServerId(null)}
        />
      )}
    </div>
    </div>
  );
}
