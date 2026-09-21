"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, notFound }   from "@/i18n/routing";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";

import { TicketDetailConversation } from "@/components/tickets/detail/TicketDetailConversation";
import { AdminTicketComposer }      from "@/components/admin/tickets/AdminTicketComposer";
import { AdminEditServerDrawer }    from "@/components/admin/servers/AdminEditServerDrawer";
import { AdminTicketDetailSidebar } from "@/components/admin/tickets/AdminTicketDetailSidebar";
import { AdminTicketDetailSkeleton } from "@/components/skeletons/admin/tickets/AdminTicketDetailSkeleton";
import { shortId } from "@/components/tickets/utils";
import { useAdminTicketDetail } from "@/hooks/admin/tickets/useAdminTickets";

const POLL_MS = 15_000;

export default function AdminTicketDetailPage() {
  const t = useTranslations('admin.tickets');
  const tCommon = useTranslations('common');
  const tErrorBackend = useTranslations('error.backend');
  const { showError, showSuccess } = useToast();
  const { id } = useParams() as { id: string };

  const [replyText,  setReplyText]  = useState("");
  const [internal,   setInternal]   = useState(false);
  const [replying,   setReplying]   = useState(false);
  
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((force = false) => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (force || scrollHeight - scrollTop - clientHeight < 150) {
      scrollContainerRef.current.scrollTop = scrollHeight;
    }
  }, []);

  const {
    ticket,
    messages,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMoreMessages,
    updateStatus,
    updatePriority,
    handleActionAPI,
    sendReplyAPI
  } = useAdminTicketDetail(id, POLL_MS, scrollToBottom);

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

  const sendReply = async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    
    const sentText   = replyText.trim();
    const isInternal = internal;

    const optimistic = {
      _id: `opt-${Date.now()}`,
      body: sentText,
      authorRole: "admin",
      internal: isInternal,
      createdAt: new Date().toISOString(),
      author: { username: t("you_admin") },
    };

    setReplyText("");

    try {
      await sendReplyAPI(sentText, isInternal, optimistic);
      showSuccess(t("message_sent"));
    } catch (e: any) {
      setReplyText(sentText);
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : e.message);
    }
    setReplying(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendReply(); }
  };

  const updateStatusHandler = async (status: string, actionKey: string) => {
    setActionBusy(actionKey);
    setActionDone(null);
    try {
      await updateStatus(status);
      showSuccess(t("ticket_marked_as", { status }));
      setActionDone(actionKey);
      setTimeout(() => setActionDone(null), 2000);
    } catch (e: any) { showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : e.message); }
    setActionBusy(null);
  };

  const updatePriorityHandler = async (priority: string) => {
    setActionBusy("priority");
    setActionDone(null);
    try {
      await updatePriority(priority);
      showSuccess(t("priority_set_to", { priority }));
      setActionDone("priority");
      setTimeout(() => setActionDone(null), 2000);
    } catch (e: any) { showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : e.message); }
    setActionBusy(null);
  };

  const handleAction = async (action: "close" | "resolve" | "delete" | "restore" | "reopen") => {
    if (action === "close")    await updateStatusHandler("closed",   "close");
    else if (action === "resolve") await updateStatusHandler("resolved", "resolve");
    else if (action === "reopen")  await updateStatusHandler("open",     "reopen");
    else if (action === "delete") {
      setActionBusy("delete");
      try { await handleActionAPI("delete"); } catch (_e: any) { setActionBusy(null); }
    } else if (action === "restore") {
      setActionBusy("restore");
      try { 
        await handleActionAPI("restore"); 
        showSuccess(t("ticket_restored"));
        setActionDone("restore"); 
        setTimeout(() => setActionDone(null), 2000); 
      } catch (e: any) {
        showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : e.message);
      }
      setActionBusy(null);
    }
  };

  useEffect(() => {
    if (error) showError(tErrorBackend.has(error) ? tErrorBackend(error) : error);
  }, [error, showError, tErrorBackend]);

  if (loading) return <AdminTicketDetailSkeleton />;
  
  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans flex items-center justify-center">
        <p className="text-[#888]">{t("failed_to_load_content")}</p>
      </div>
    );
  }
  
  if (!ticket) notFound();

  const username = ticket.user?.username || ticket.user?.email || tCommon("user");
  const canSend = !ticket.deletedByUser;

  const adminsInvolved = Array.from(new Set(
    messages
      .filter(m => (m.authorRole === 'admin' || (m as any).isAdmin))
      .map(m => {
        const authorObj = m.author || (typeof m.userId === 'object' ? m.userId : null);
        return authorObj?.username || authorObj?.email || t("support_staff");
      })
  ));
  const adminsText = adminsInvolved.length > 0 ? adminsInvolved.join(", ") : t("none_yet");

  return (
    <div className="flex-1 relative bg-[#0F0F0F]">
      <div className="absolute inset-0 pt-4 sm:pt-6 px-4 sm:px-6 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full space-y-6 min-h-0">
          <header className="border-b border-white/[0.06] pb-6 shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{ticket.title}</h1>
              {ticket.deletedByUser && (
                <span className="text-[10px] font-bold text-red-500 uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                  {t("deleted")}
                </span>
              )}
            </div>
            <p className="text-[#888888] mt-1 text-sm">
              {t("ticket_number", { id: shortId(ticket._id) })}
            </p>
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
                    onLoadMore={() => loadMoreMessages(scrollContainerRef)}
                    viewerRole="admin"
                    onServerMentionClick={(id) => setEditServerId(id)}
                  />
                </div>
                <div className="w-full shrink-0 px-6 pb-2 pt-0">
                  <AdminTicketComposer
                    replyText={replyText}
                    replying={replying}
                    internal={internal}
                    canSend={canSend}
                    onTextChange={setReplyText}
                    onSend={() => void sendReply()}
                    onKeyDown={handleKeyDown}
                    onToggleInternal={() => setInternal(v => !v)}
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[380px] shrink-0 overflow-y-auto min-h-0 pr-2">
              <AdminTicketDetailSidebar 
                ticket={ticket}
                username={username}
                adminsText={adminsText}
                actionBusy={actionBusy}
                actionDone={actionDone}
                onUpdateStatus={updateStatusHandler}
                onUpdatePriority={updatePriorityHandler}
                onAction={handleAction}
              />
            </div>
          </div>
        </div>
      </div>

      {editServerId && (
        <AdminEditServerDrawer
          serverId={editServerId}
          onClose={() => setEditServerId(null)}
        />
      )}
    </div>
  );
}

