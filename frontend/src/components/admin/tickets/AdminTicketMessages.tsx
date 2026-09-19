"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

function safeTime(val: any): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function safeDate(val: any): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface AdminMessage {
  _id: string;
  body: string;
  authorRole?: string;
  internal?: boolean;
  createdAt: string;
  author?: { _id?: string; username?: string; email?: string };
}

interface AdminTicketMessagesProps {
  messages: AdminMessage[];
  ticketUserId?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function AdminTicketMessages({
  messages,
  ticketUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: AdminTicketMessagesProps) {
  const topRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver — fires onLoadMore when top sentinel enters the viewport
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "100px", threshold: 0.1 }
    );
    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="flex flex-col gap-6">
      {/* Load-more sentinel */}
      {hasMore && (
        <div ref={topRef} className="flex justify-center py-2">
          {isLoadingMore && <Loader2 size={16} className="animate-spin text-white/30" />}
        </div>
      )}

      {!hasMore && messages.length === 0 && (
        <p className="py-8 text-center text-sm font-medium text-white/30">No messages yet.</p>
      )}

      {messages.map((m, i) => {
        const isFromUser =
          m.authorRole === "user" ||
          (m.authorRole === undefined &&
            String(m.author?._id || m.author) === String(ticketUserId));

        let authorName = m.author?.username || m.author?.email;
        if (!authorName) {
          authorName = isFromUser ? "User" : "Admin";
        } else if (!isFromUser) {
          authorName = `${authorName} · Admin`;
        }

        const msgDate = safeDate(m.createdAt);
        const prevMsgDate = i > 0 ? safeDate(messages[i - 1].createdAt) : null;
        const showDateDivider = msgDate !== prevMsgDate;

        const timeStr = safeTime(m.createdAt);

        // Bubble alignment: user = left, admin = right
        const isRight = !isFromUser;

        return (
          <React.Fragment key={m._id || i}>
            {showDateDivider && (
              <div className="my-2 flex justify-center">
                <span className="text-xs font-semibold text-white/40">{msgDate}</span>
              </div>
            )}

            <div className={`flex w-full min-w-0 ${isRight ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[80%] min-w-0 flex-col ${isRight ? "items-end" : "items-start"}`}>

                {/* Author + internal badge row */}
                <div className={`mb-1.5 flex items-center gap-2 ${isRight ? "flex-row-reverse" : ""}`}>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/70">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/60">{authorName}</span>
                  {m.internal && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-yellow-600/20 text-yellow-300 border-yellow-700/50 font-semibold">
                      INTERNAL
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed text-[#d5d5d5] min-w-0 max-w-full relative ${
                  isRight
                    ? m.internal
                      ? "rounded-tr-sm bg-yellow-950/40 border border-yellow-700/30"
                      : "rounded-tr-sm bg-[#151515] border border-[#282828]"
                    : "rounded-tl-sm bg-[#121212] border border-[#282828]"
                }`}>
                  <div className="pb-4"><RichText text={m.body} viewerRole="admin" /></div>
                  {timeStr && (
                    <span className={`absolute bottom-1.5 right-3 text-[11px] font-medium ${
                      m.internal ? "text-yellow-400/60" : "text-white/30"
                    }`}>{timeStr}</span>
                  )}
                </div>

              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function RichText({ text, viewerRole }: { text: string; viewerRole: 'admin' | 'user' }) {
  const regex = /\[@(server|invoice):([a-zA-Z0-9_-]+):([^\]]+)\]/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const type = match[1];
    const id = match[2];
    const name = match[3];

    parts.push(
      <MentionPill key={match.index} type={type as 'server'|'invoice'} id={id} name={name} viewerRole={viewerRole} />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className="whitespace-pre-wrap break-words">{parts.length > 0 ? parts : text}</span>;
}

function MentionPill({ type, id, name, viewerRole }: { type: 'server'|'invoice'; id: string; name: string; viewerRole: 'admin'|'user' }) {
  const [downloading, setDownloading] = React.useState(false);
  const { showError } = useToast();

  const handleClick = async () => {
    if (type === 'server') {
      const url = viewerRole === 'admin' ? `/admin/servers/${id}` : `/server/${id}`;
      window.open(url, '_blank');
    } else if (type === 'invoice') {
      try {
        setDownloading(true);
        const token = localStorage.getItem("auth_token");
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
        const endpoint = viewerRole === 'admin' 
          ? `${API_BASE}/api/admin/payments/${id}/invoice` 
          : `${API_BASE}/api/payments/${id}/invoice`;
          
        const r = await fetchWithRetry(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error("Failed to download");
        const blob = await r.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error(e);
        showError("Failed to download invoice.");
      } finally {
        setDownloading(false);
      }
    }
  };

  const Icon = type === 'server' ? (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></rect><line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></line><line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></line></svg>
  ) : (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
  );

  return (
    <span 
      onClick={handleClick}
      className={`inline-flex items-center cursor-pointer align-middle font-medium mx-0.5 transition-colors ${
        type === 'server' 
          ? 'text-[#FF5722] hover:text-[#ff7448]' 
          : 'text-emerald-400 hover:text-emerald-300'
      } ${downloading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {downloading ? <Loader2 size={14} className="animate-spin mr-1" /> : Icon}
      {name}
    </span>
  );
}

