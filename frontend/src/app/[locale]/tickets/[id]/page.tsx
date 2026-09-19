'use client';

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "@/i18n/routing";
import { notFound } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';

import {
  TicketDetailConversation,
  TicketDetailComposer,
  TicketDetailPanel,
  TicketDetailSkeleton,
} from '@/components/tickets/detail';
import { EditServerDrawer } from '@/components/server/EditServerDrawer';

import { Priority } from '@/components/tickets/types';
import { shortId } from '@/components/tickets/utils';
import { useTicketDetail } from '@/components/tickets/hooks';

export default function TicketDetailPage() {
  const t = useTranslations('Tickets');
  const tCommon = useTranslations('Common');
  const tError = useTranslations('GlobalErrors');
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

  /* -- Priority handling (UI mapping) -------------------- */
  const priorityMap: Record<string, { label: string; level: Priority }> = {
    low:    { label: t('priorities.low'), level: 'low' },
    medium: { label: t('priorities.normal'), level: 'medium' },
    normal: { label: t('priorities.normal'), level: 'medium' },
    high:   { label: t('priorities.high'), level: 'high' }
  };
  const priority = priorityMap[ticket?.priority || 'low'] || priorityMap.low;

  /* -- Responsive details -------------------------------- */
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

  useEffect(() => {
    if (messages.length > 0 && !loadingMore) scrollToBottom();
  }, [messages.length, loadingMore]);

  /* -- Send reply ---------------------------------------- */
  const handleSendReply = async () => {
    if (!replyText.trim() || replying) return;
    const { ok, error: err } = await sendReply(replyText);
    if (ok) {
      setReplyText('');
      setTimeout(() => scrollToBottom(true), 0);
    } else if (err) {
      showError(err);
    }
  };

  /* -- Status update ------------------------------------- */
  const handleUpdateStatus = async (action: 'resolved' | 'reopen') => {
    setStatusDone(null);
    const { ok, error: err } = await updateStatus(action);
    if (ok) {
      const successMsg = action === 'resolved' ? t('ticketResolved') : t('ticketReopened');
      showSuccess(successMsg);
      setStatusDone(action);
      setTimeout(() => setStatusDone(null), 2000);
    } else {
      showError(err || (action === 'resolved' ? t('failedToResolve') : t('failedToReopen')));
    }
  };

  /* -- Copy ID ------------------------------------------- */
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(shortId(id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSendReply(); }
  };

  /* -- Guards -------------------------------------------- */
  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  if (loading) return <TicketDetailSkeleton />;
  
  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<MessageSquare strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t('loadError')}
          title={tError("failedToLoadTickets")}
          errorString={error}
          description={<ErrorDescription error={error} topic="Ticket" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('retry')}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }
  
  if (!ticket) notFound();

  /* -- Derived values ------------------------------------ */
  const status       = ticket.status;
  const replyAllowed = status === 'open' || status === 'pending';
  const username     = ticket.user?.username || ticket.user?.email || t('you');
  const createdDate  = new Date(ticket.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const adminsInvolved = Array.from(new Set(
    messages
      .filter(m => (m.authorRole === 'admin' || (m as any).isAdmin))
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
              <p className="text-[#888888] mt-1 text-sm">{t('ticketId')}{shortId(ticket._id)}</p>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
          
          <div className="flex-1 min-w-0 w-full flex flex-col min-h-0">
            <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
              
              <div 
                ref={scrollContainerRef} 
                className="p-6 flex-1 overflow-y-auto min-h-0"
                style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}
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
                ticketId={shortId(ticket._id)}
                status={status}
                category={ticket.category || 'General'}
                priority={priority}
                createdDate={createdDate}
                updatedAt={ticket.updatedAt}
                replyAllowed={replyAllowed}
                statusBusy={statusBusy}
                statusDone={statusDone}
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
