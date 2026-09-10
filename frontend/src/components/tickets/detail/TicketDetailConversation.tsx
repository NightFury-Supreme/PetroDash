import React, { useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { TicketMessage } from '../types';
import { formatRelative } from '../utils';
import { Loader2 } from 'lucide-react';

interface TicketDetailConversationProps {
  messages:       TicketMessage[];
  username:       string;
  hasMore?:       boolean;
  isLoadingMore?: boolean;
  onLoadMore?:    () => void;
  viewerRole?:    'user' | 'admin';
  onServerMentionClick?: (serverId: string) => void;
}

export function TicketDetailConversation({
  messages,
  username,
  hasMore,
  isLoadingMore,
  onLoadMore,
  viewerRole = 'user',
  onServerMentionClick,
}: TicketDetailConversationProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialScrolledRef = useRef(false);

  // Instantly position scroll at bottom before paint on initial load
  React.useLayoutEffect(() => {
    if (!initialScrolledRef.current && messages.length > 0) {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ block: 'end' });
      }
      initialScrolledRef.current = true;
    }
  }, [messages]);

  // Infinite scroll observer for loading older messages at top (only after initial bottom scroll)
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    // Small delay to ensure initial bottom positioning is fully set before listening to top intersection
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoadingMore && initialScrolledRef.current) {
            onLoadMore();
          }
        },
        { root: null, rootMargin: '100px', threshold: 0.1 }
      );
      if (topRef.current) observer.observe(topRef.current);
      return () => observer.disconnect();
    }, 150);

    return () => clearTimeout(timer);
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="mb-4">
      {hasMore && (
        <div ref={topRef} className="flex justify-center py-4">
          {isLoadingMore && <Loader2 size={16} className="animate-spin text-white/30" />}
        </div>
      )}
      
      {/* Messages */}
      <div className="flex flex-col gap-6">
        {!hasMore && messages.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-white/30">No messages yet.</p>
        )}
        {messages.map((msg, i) => {
          const authorRole = (msg.authorRole === 'admin' || (msg as any).isAdmin) ? 'admin' : 'user';
          const isAdmin = authorRole === 'admin';
          const isMine = viewerRole === authorRole;
          
          const authorObj = msg.author || (typeof msg.userId === 'object' ? msg.userId : null);
          const authorName = authorObj?.username || authorObj?.email || null;
          const author  = authorName || (isAdmin ? 'Support Staff' : username);
          
          const isInternal = msg.internal || msg.isInternal || false;
          const avatarUrl = authorObj?.profilePicture || null;

          const msgDate = new Date(msg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const prevMsgDate = i > 0 ? new Date(messages[i-1].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
          const showDateDivider = msgDate !== prevMsgDate;

          return (
            <React.Fragment key={msg._id || i}>
              {showDateDivider && (
                <div className="my-2 flex justify-center">
                  <span className="text-xs font-semibold text-white/40">{msgDate}</span>
                </div>
              )}
              <MessageBubble
                author={author}
                letter={author.charAt(0).toUpperCase()}
                isAdmin={isAdmin}
                isMine={isMine}
                isInternal={isInternal}
                text={msg.body || (msg as any).message || ''}
                time={formatRelative(msg.createdAt)}
                avatarUrl={avatarUrl}
                viewerRole={viewerRole}
                onServerMentionClick={onServerMentionClick}
              />
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} className="h-0 w-0 pointer-events-none" />
      </div>
    </div>
  );
}

function MessageBubble({
  author, letter, isAdmin, isMine, isInternal, text, time, avatarUrl, viewerRole, onServerMentionClick
}: {
  author: string; letter: string; isAdmin: boolean; isMine: boolean; isInternal: boolean; text: string; time: string; avatarUrl?: string | null; viewerRole: 'admin' | 'user'; onServerMentionClick?: (serverId: string) => void;
}) {
  return (
    <div className={`flex w-full min-w-0 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] min-w-0 flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        
        {/* Author row */}
        <div className={`mb-1.5 flex items-center gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[11px] font-semibold text-white/70">
            {avatarUrl ? (
              <img src={avatarUrl} alt={author} className="h-full w-full object-cover" />
            ) : (
              letter
            )}
          </div>
          
          <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
            {isAdmin && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
                Admin
              </span>
            )}
            
            {isAdmin && <span className="h-1 w-1 rounded-full bg-white/20" />}
            
            <span className="text-sm font-medium text-white/60">{author}</span>
          </div>
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed min-w-0 max-w-full ${
          isInternal
            ? 'rounded-tr-sm bg-yellow-900/30 border border-yellow-700/30 text-yellow-100'
            : isMine
              ? 'rounded-tr-sm bg-[#151515] border border-[#282828] text-[#d5d5d5]'
              : 'rounded-tl-sm bg-[#121212] border border-[#282828] text-[#d5d5d5]'
        }`}>
          <div className={`text-sm leading-[1.6] ${isInternal ? 'text-yellow-100/90' : 'text-white/80'}`}>
            <RichText text={text} viewerRole={viewerRole} onServerMentionClick={onServerMentionClick} />
          </div>
        </div>

        {/* Timestamp */}
        <div className={`mt-1.5 flex items-center gap-2 ${isMine ? 'justify-end' : ''}`}>
          <span className="text-xs text-white/30 shrink-0">{time}</span>
        </div>
      </div>
    </div>
  );
}

function RichText({ text, viewerRole, onServerMentionClick }: { text: string; viewerRole: 'admin' | 'user'; onServerMentionClick?: (serverId: string) => void; }) {
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
      <MentionPill key={match.index} type={type as 'server'|'invoice'} id={id} name={name} viewerRole={viewerRole} onServerMentionClick={onServerMentionClick} />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className="whitespace-pre-wrap break-words">{parts.length > 0 ? parts : text}</span>;
}

function MentionPill({ type, id, name, viewerRole, onServerMentionClick }: { type: 'server'|'invoice'; id: string; name: string; viewerRole: 'admin'|'user'; onServerMentionClick?: (serverId: string) => void; }) {
  const [downloading, setDownloading] = React.useState(false);
  const { showError } = useToast();

  const handleClick = async () => {
    if (type === 'server') {
      if (onServerMentionClick) {
        onServerMentionClick(id);
      } else {
        const url = viewerRole === 'admin' ? `/admin/servers/${id}` : `/server/${id}`;
        window.open(url, '_blank');
      }
    } else if (type === 'invoice') {
      try {
        setDownloading(true);
        const token = localStorage.getItem("auth_token");
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
        const endpoint = viewerRole === 'admin' 
          ? `${API_BASE}/api/admin/payments/${id}/invoice` 
          : `${API_BASE}/api/payments/${id}/invoice`;
          
        const r = await fetch(endpoint, {
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
      } ${downloading ? 'opacity-50 cursor-wait' : ''}`}
      title={type === 'server' ? 'View Server' : 'Download Invoice'}
    >
      {downloading ? (
        <Loader2 size={14} className="animate-spin mr-1" />
      ) : Icon}
      {name}
    </span>
  );
}
