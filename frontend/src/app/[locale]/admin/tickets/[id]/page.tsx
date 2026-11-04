"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "@/i18n/routing";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";

import { TicketDetailConversation } from "@/components/tickets/detail/TicketDetailConversation";
import {
  AdminTicketComposer,
  AdminTicketDetailSidebar,
  AdminTicketErrorView,
} from "@/components/admin/tickets";
import { AdminTicketDetailSkeleton } from "@/components/skeletons/admin/tickets";
import { shortId } from "@/components/tickets/utils";
import { useAdminTicketDetail } from "@/hooks/admin/tickets";

const AdminEditServerDrawer = dynamic(
  () => import("@/components/admin/servers/AdminEditServerDrawer").then((mod) => mod.AdminEditServerDrawer),
  { ssr: false }
);

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const t = useTranslations("AdminTickets");
  const tCommon = useTranslations("Common");
  const tErrorBackend = useTranslations("BackendErrors");
  const { showError, showSuccess } = useToast();
  const { id } = useParams() as { id: string };

  const [replyText, setReplyText] = useState("");
  const [internal, setInternal] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const actionDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (actionDoneTimeoutRef.current) clearTimeout(actionDoneTimeoutRef.current);
    };
  }, []);

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
    fetchTicket,
    loadMoreMessages,
    updateStatus,
    updatePriority,
    handleActionAPI,
    sendReplyAPI,
  } = useAdminTicketDetail(id, undefined, scrollToBottom, () => router.push("/admin/tickets"));

  React.useLayoutEffect(() => {
    if (!loading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [loading]);

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || replying) return;
    setReplying(true);

    try {
      await sendReplyAPI(text, internal);
      setReplyText("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tCommon("error");
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : msg);
    }
    setReplying(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendReply();
    }
  };

  const handleStatusChange = async (status: string, key: string) => {
    setActionBusy(key);
    setActionDone(null);
    try {
      await updateStatus(status);
      const labelMap: Record<string, string> = {
        open: t("statusOpen"),
        pending: t("statusPending"),
        resolved: t("statusResolved"),
        closed: t("statusClosed"),
      };
      showSuccess(t("ticket_marked_as", { status: labelMap[status] || status }));
      setActionDone(key);
      if (actionDoneTimeoutRef.current) clearTimeout(actionDoneTimeoutRef.current);
      actionDoneTimeoutRef.current = setTimeout(() => setActionDone(null), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tCommon("error");
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : msg);
    }
    setActionBusy(null);
  };

  const handlePriorityChange = async (priority: string) => {
    setActionBusy("priority");
    setActionDone(null);
    try {
      await updatePriority(priority);
      const pMap: Record<string, string> = {
        low: t("priorityLow"),
        medium: t("priorityMedium"),
        high: t("priorityHigh"),
      };
      showSuccess(t("priority_set_to", { priority: pMap[priority] || priority }));
      setActionDone("priority");
      if (actionDoneTimeoutRef.current) clearTimeout(actionDoneTimeoutRef.current);
      actionDoneTimeoutRef.current = setTimeout(() => setActionDone(null), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tCommon("error");
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : msg);
    }
    setActionBusy(null);
  };

  const handleAction = async (action: "close" | "resolve" | "delete" | "restore" | "reopen") => {
    if (action === "close") return handleStatusChange("closed", "close");
    if (action === "resolve") return handleStatusChange("resolved", "resolve");
    if (action === "reopen") return handleStatusChange("open", "reopen");

    setActionBusy(action);
    try {
      await handleActionAPI(action);
      if (action === "restore") {
        showSuccess(t("ticket_restored"));
        setActionDone("restore");
        if (actionDoneTimeoutRef.current) clearTimeout(actionDoneTimeoutRef.current);
        actionDoneTimeoutRef.current = setTimeout(() => setActionDone(null), 2000);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tCommon("error");
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : msg);
    }
    setActionBusy(null);
  };

  useEffect(() => {
    if (error) showError(tErrorBackend.has(error) ? tErrorBackend(error) : error);
  }, [error, showError, tErrorBackend]);

  if (loading) return <AdminTicketDetailSkeleton />;

  if (error || !ticket) {
    return <AdminTicketErrorView error={error} />;
  }

  const username = ticket.user?.username || ticket.user?.email || tCommon("user");
  const canSend = !ticket.deletedByUser;
  const staff = Array.from(new Set(
    messages.filter(m => m.authorRole === "admin").map(m => {
      const a = m.author || (typeof m.userId === "object" ? m.userId : null);
      return a?.username || a?.email || t("support_staff");
    })
  ));
  const adminsText = staff.length > 0 ? staff.join(", ") : t("none_yet");

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
            <p className="text-[#888888] mt-1 text-sm">{t("ticket_number", { id: shortId(ticket.id) })}</p>
          </header>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
            <div className="flex-1 min-w-0 w-full flex flex-col min-h-0">
              <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
                <div
                  ref={scrollContainerRef}
                  className="p-6 flex-1 overflow-y-auto min-h-0"
                  style={{ opacity: loading ? 0 : 1, transition: "opacity 0.2s" }}
                >
                  <TicketDetailConversation
                    messages={messages}
                    username={username}
                    hasMore={hasMore}
                    isLoadingMore={loadingMore}
                    onLoadMore={() => loadMoreMessages(scrollContainerRef)}
                    viewerRole="admin"
                    onServerMentionClick={(sid) => setEditServerId(sid)}
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
                    onToggleInternal={() => setInternal((v) => !v)}
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
                onUpdateStatus={handleStatusChange}
                onUpdatePriority={handlePriorityChange}
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
