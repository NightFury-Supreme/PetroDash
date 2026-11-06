"use client";

import { useEffect, useState, useCallback, RefObject } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { API_BASE, getToken } from "@/components/tickets/utils";

export interface MentionServer {
  id: string;
  name: string;
  identifier?: string;
}

export interface MentionPayment {
  id: string;
  amount?: number;
}

export interface MentionsData {
  servers: MentionServer[];
  payments: MentionPayment[];
}

const mentionsCache = new Map<string, MentionsData>();
const inFlightMentions = new Map<string, Promise<MentionsData>>();

export function useTicketMentions(
  editorRef: RefObject<HTMLDivElement | null>,
  onMessageChange: (v: string) => void,
  ticketId?: string
) {
  const cacheKey = ticketId || "global";
  const [mentionsData, setMentionsData] = useState<MentionsData | null>(() => mentionsCache.get(cacheKey) || null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setMentionsData({ servers: [], payments: [] });
      return;
    }

    const cached = mentionsCache.get(cacheKey);
    if (cached) {
      setMentionsData(cached);
    }

    const endpoint = ticketId
      ? `${API_BASE}/api/tickets/${ticketId}/mentions`
      : `${API_BASE}/api/tickets/mentions/search`;

    let request = inFlightMentions.get(cacheKey);
    if (!request) {
      request = fetchWithRetry(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((d: MentionsData) => {
          const sanitized: MentionsData = {
            servers: Array.isArray(d?.servers) ? d.servers : [],
            payments: Array.isArray(d?.payments) ? d.payments : [],
          };
          mentionsCache.set(cacheKey, sanitized);
          return sanitized;
        })
        .catch(() => ({ servers: [], payments: [] }))
        .finally(() => {
          inFlightMentions.delete(cacheKey);
        });
      inFlightMentions.set(cacheKey, request);
    }

    let isCurrent = true;
    request.then((data) => {
      if (isCurrent) setMentionsData(data);
    });

    return () => {
      isCurrent = false;
    };
  }, [ticketId, cacheKey]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    function getRawText(node: Node): string {
      let text = "";
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          if (el.tagName === "SPAN" && el.dataset.type) {
            text += `[@${el.dataset.type}:${el.dataset.id}:${el.dataset.name}]`;
          } else if (el.tagName === "DIV" || el.tagName === "P") {
            text += "\n" + getRawText(el);
          } else if (el.tagName === "BR") {
            text += "\n";
          } else {
            text += getRawText(el);
          }
        }
      }
      return text;
    }

    let parsedText = getRawText(editorRef.current);
    if (parsedText.startsWith("\n")) parsedText = parsedText.substring(1);

    const match = parsedText.match(/@([a-zA-Z0-9_-]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }

    onMessageChange(parsedText);
  }, [editorRef, onMessageChange]);

  const insertMentionPill = useCallback(
    (type: string, itemId: string, name: string) => {
      if (!editorRef.current) return;
      editorRef.current.focus();

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || "";
          const matchIndex = text.lastIndexOf("@");
          if (matchIndex >= 0) {
            range.setStart(textNode, matchIndex);
            range.deleteContents();
          }
        }

        const el = document.createElement("span");
        el.className =
          "inline-flex items-center gap-1 bg-[#282828] text-[#D4D4D4] px-2 py-0.5 rounded text-xs font-medium border border-[#333] mx-1 select-all";
        el.dataset.type = type;
        el.dataset.id = itemId;
        el.dataset.name = name;
        el.contentEditable = "false";

        const iconHTML =
          type === "server"
            ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#888]"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#888]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;

        el.innerHTML = `${iconHTML} ${name}`;

        range.insertNode(el);
        range.setStartAfter(el);

        const space = document.createTextNode("\u00A0");
        range.insertNode(space);
        range.setStartAfter(space);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
      }

      handleInput();
      setMentionQuery(null);
    },
    [editorRef, handleInput]
  );

  let filteredServers = mentionsData?.servers || [];
  let filteredPayments = mentionsData?.payments || [];

  if (mentionQuery) {
    filteredServers = filteredServers.filter(
      (s) =>
        s.name.toLowerCase().includes(mentionQuery) ||
        s.identifier?.toLowerCase().includes(mentionQuery)
    );
    filteredPayments = filteredPayments.filter(
      (p) =>
        p.id.toLowerCase().includes(mentionQuery) ||
        "invoice".includes(mentionQuery) ||
        `invoice #${p.id.slice(-6).toLowerCase()}`.includes(mentionQuery)
    );
  }

  return {
    mentionsData,
    mentionQuery,
    filteredServers,
    filteredPayments,
    handleInput,
    insertMentionPill,
    setMentionQuery,
  };
}
