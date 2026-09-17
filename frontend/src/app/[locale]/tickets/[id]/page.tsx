'use client';
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams }                              from "@/i18n/routing";
import { notFound } from "@/i18n/routing";
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

import { Priority, SupportTicket, TicketMessage } from '@/components/tickets/types';
import { API_BASE, getToken, shortId } from '@/components/tickets/utils';

const POLL_MS = 15_000;

export default function TicketDetailPage() {
  const { showError, showSuccess } = useToast();
  const { id } = useParams() as { id: string };

  /* -- Remote data --------------------------------------- */
  const [ticket, setTicket]     = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  /* -- Local UI state ------------------------------------ */
  const [replyText, setReplyText]         = useState('');
  const [replying, setReplying]           = useState(false);
  const [statusBusy, setStatusBusy]       = useState(false);
  const [statusDone, setStatusDone]       = useState<'resolved' | 'reopen' | null>(null);
  const [priority, setPriority]           = useState<Priority>('Normal');
  const [priorityOpen, setPriorityOpen]   = useState(false);
  const [actionsOpen, setActionsOpen]     = useState(false);
  const [detailsOpen]                     = useState(true);
  const [copied, setCopied]               = useState(false);
  const [hasMore, setHasMore]             = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [editServerId, setEditServerId]   = useState<string | null>(null);
  const scrollContainerRef                = useRef<HTMLDivElement>(null);

  /* -- Fetch --------------------------------------------- */
  const fetchTicket = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || 'Failed to load ticket');
      setTicket(d);
      if (d?.priority) {
        const p = String(d.priority);
        setPriority((p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()) as Priority);
      }
      if (!silent) setError(null);
    } catch (e: any) {
      if (!silent) setError(e.message || 'Failed to load ticket');
    }
  }, [id]);

  const scrollToBottom = useCallback((force = false) => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Auto-scroll if forced (e.g. initial load, sending message) OR if user is already near bottom
    if (force || scrollHeight - scrollTop - clientHeight < 150) {
      scrollContainerRef.current.scrollTop = scrollHeight;
    }
  }, []);

  const fetchInitialMessages = useCallback(async (isPoll = false) => {
    if (!id) return;
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setMessages(d.messages || []);
        setHasMore(!!d.hasMore);
        // Force scroll on initial load, otherwise only if near bottom
        setTimeout(() => scrollToBottom(!isPoll), 0);
      }
    } catch {}
  }, [id, scrollToBottom]);

  const loadMoreMessages = async () => {
    if (!id || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0]._id;
    
    // Record scroll state before loading
    const container = scrollContainerRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;
    const previousScrollTop = container ? container.scrollTop : 0;

    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/messages?limit=50&before=${oldestId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.messages) {
        setMessages(prev => [...d.messages, ...prev]);
        setHasMore(!!d.hasMore);
        
        // Restore scroll position after React renders
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
          }
        }, 0);
      }
    } catch {}
    setLoadingMore(false);
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchTicket(), fetchInitialMessages()]);
      setLoading(false);
    };
    init();
    
    // Polling only refreshes the ticket status and latest messages
    pollRef.current = setInterval(() => {
      fetchTicket(true);
      // Only refresh messages if we haven't loaded older history to avoid wiping it
      setMessages(prev => {
        if (prev.length <= 50) {
          fetchInitialMessages(true);
        }
        return prev;
      });
    }, POLL_MS);
    
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTicket, fetchInitialMessages]);

  // Instantly pin scroll to bottom before painting when loading completes
  React.useLayoutEffect(() => {
    if (!loading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [loading]);

  /* -- Close dropdowns on outside click ----------------- */
  useEffect(() => {
    if (!actionsOpen && !priorityOpen) return;
    const close = () => { setActionsOpen(false); setPriorityOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [actionsOpen, priorityOpen]);

  /* -- Send reply ---------------------------------------- */
  const sendReply = async () => {
    const value = replyText.trim();
    if (!value || replying) return;
    setReplying(true);
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ body: value }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { 
        setReplyText(''); 
        await fetchTicket(true); 
        if (d.message) {
          setMessages(prev => [...prev, d.message]);
          setTimeout(() => scrollToBottom(true), 0);
        }
      }
    } catch {}
    setReplying(false);
  };

  /* -- Status update ------------------------------------- */
  const updateStatus = async (action: 'resolved' | 'reopen') => {
    setStatusBusy(true);
    setStatusDone(null);
    setActionsOpen(false);
      try {
        const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/status`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body:    JSON.stringify({ action }),
        });
        if (r.ok) {
          await fetchTicket(true);
          const successMsg = action === 'resolved' ? "Ticket marked as resolved" : "Ticket reopened";
          showSuccess(successMsg);
          setStatusDone(action);
          setTimeout(() => setStatusDone(null), 2000);
        } else {
          const d = await r.json().catch(() => ({}));
          const errorMsg = action === 'resolved' ? "Failed to mark as resolved" : "Failed to reopen ticket";
          throw new Error(d.error || errorMsg);
        }
      } catch (e: any) {
        setStatusBusy(false);
        const errorMsg = action === 'resolved' ? "Failed to mark as resolved" : "Failed to reopen ticket";
        showError(e.message || errorMsg);
      }
    setStatusBusy(false);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendReply(); }
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
          kicker="Load Error"
          title="Failed to Load Ticket"
          errorString={error}
          description={<ErrorDescription error={error} topic="Ticket" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
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
  const username     = ticket.user?.username || ticket.user?.email || 'You';
  const createdDate  = new Date(ticket.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const adminsInvolved = Array.from(new Set(
    messages
      .filter(m => (m.authorRole === 'admin' || (m as any).isAdmin))
      .map(m => {
        const authorObj = m.author || (typeof m.userId === 'object' ? m.userId : null);
        return authorObj?.username || authorObj?.email || "Support Staff";
      })
  ));
  const adminsText = adminsInvolved.length > 0 ? adminsInvolved.join(", ") : "None yet";

  return (
    <div className="flex-1 relative bg-[#0F0F0F]">
      <div className="absolute inset-0 pt-4 sm:pt-6 px-4 sm:px-6 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full space-y-6 min-h-0">
          
          {/* Standard Page Header */}
          <header className="border-b border-white/[0.06] pb-6 shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{ticket.title}</h1>
              <p className="text-[#888888] mt-1 text-sm">Ticket #{shortId(ticket._id)}</p>
            </div>
          </header>

          {/* Two-column layout (matches profile/tickets) */}
          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
          
          {/* Left Column (Chat Area) */}
          <div className="flex-1 min-w-0 w-full flex flex-col min-h-0">
            {/* Content area */}
            <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
              
              {/* Chat Messages */}
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
              
              {/* Composer */}
              <div className="w-full shrink-0 px-6 pb-2 pt-0">
                <TicketDetailComposer
                  status={status}
                  replyText={replyText}
                  replying={replying}
                  statusBusy={statusBusy}
                  onTextChange={setReplyText}
                  onSend={() => void sendReply()}
                  onKeyDown={handleKeyDown}
                  onReopen={() => updateStatus('reopen')}
                />
              </div>
            </div>
          </div>
          
          {/* Right Column (Sidebar) */}
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
                onResolve={() => updateStatus('resolved')}
                onReopen={() => updateStatus('reopen')}
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

