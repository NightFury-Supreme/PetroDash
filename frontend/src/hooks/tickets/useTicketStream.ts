"use client";

import { useEffect, useRef } from "react";
import type { TicketMessage, TicketStatus } from "@/components/tickets/types";
import { API_BASE, getToken } from "@/components/tickets/utils";

export interface TicketAssignee {
  id: string;
  username?: string;
  email?: string;
  profilePicture?: string;
}

export interface TicketUpdateData {
  status?: TicketStatus;
  priority?: "low" | "medium" | "high" | "urgent" | string;
  assignee?: TicketAssignee | string | null;
  tags?: string[];
  deletedByUser?: boolean;
  updatedAt?: string;
  deleted?: boolean;
}

export interface TicketStreamEvent {
  type: "CONNECTED" | "TICKET_MESSAGE" | "TICKET_STATUS" | "TICKET_UPDATED";
  ticketId: string;
  message?: TicketMessage;
  status?: TicketStatus;
  priority?: "low" | "medium" | "high" | "urgent" | string;
  assignee?: string | null;
  tags?: string[];
  deletedByUser?: boolean;
  updatedAt?: string;
  deleted?: boolean;
}

export interface UseTicketStreamOptions {
  onMessage?: (message: TicketMessage) => void;
  onStatus?: (status: TicketStatus) => void;
  onUpdate?: (data: TicketUpdateData) => void;
  onReconnect?: () => void;
}

interface StreamInstance {
  ticketId: string;
  subscribers: Set<UseTicketStreamOptions>;
  abortController: AbortController | null;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  teardownTimeout: ReturnType<typeof setTimeout> | null;
  reconnectDelay: number;
  isActive: boolean;
}

const activeStreams = new Map<string, StreamInstance>();

function getOrCreateStream(ticketId: string): StreamInstance {
  let instance = activeStreams.get(ticketId);
  if (!instance) {
    instance = {
      ticketId,
      subscribers: new Set(),
      abortController: null,
      reconnectTimeout: null,
      teardownTimeout: null,
      reconnectDelay: 2000,
      isActive: false,
    };
    activeStreams.set(ticketId, instance);
  }
  return instance;
}

function startStream(instance: StreamInstance) {
  if (instance.isActive || instance.subscribers.size === 0) return;

  const token = getToken();
  if (!token) return;

  instance.isActive = true;
  instance.abortController = new AbortController();
  const currentController = instance.abortController;

  const run = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${instance.ticketId}/stream`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: currentController.signal,
      });

      if (!response.ok || !response.body) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          instance.isActive = false;
          return;
        }
        throw new Error("TICKET_STREAM_CONNECT_FAILED");
      }

      instance.reconnectDelay = 2000;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (instance.isActive && !currentController.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          const dataMatch = trimmed.match(/^data:\s*(.+)$/m);
          if (!dataMatch) continue;

          try {
            const event = JSON.parse(dataMatch[1]) as TicketStreamEvent;
            if (event.type === "TICKET_MESSAGE" && event.message) {
              instance.subscribers.forEach((sub) => sub.onMessage?.(event.message!));
            } else if (event.type === "TICKET_STATUS" && event.status) {
              instance.subscribers.forEach((sub) => {
                sub.onStatus?.(event.status!);
                sub.onUpdate?.({ status: event.status! });
              });
            } else if (event.type === "TICKET_UPDATED") {
              if (event.status) {
                instance.subscribers.forEach((sub) => sub.onStatus?.(event.status!));
              }
              instance.subscribers.forEach((sub) =>
                sub.onUpdate?.({
                  status: event.status,
                  priority: event.priority,
                  assignee: event.assignee,
                  tags: event.tags,
                  deletedByUser: event.deletedByUser,
                  updatedAt: event.updatedAt,
                  deleted: event.deleted,
                })
              );
            } else if (event.type === "CONNECTED") {
              if (event.status || event.priority) {
                instance.subscribers.forEach((sub) => {
                  if (event.status) sub.onStatus?.(event.status!);
                  sub.onUpdate?.({
                    status: event.status,
                    priority: event.priority,
                  });
                });
              }
            }
          } catch {}
        }
      }
    } catch {
      if (!instance.isActive || currentController.signal.aborted) return;

      instance.reconnectDelay = Math.min(instance.reconnectDelay * 1.5, 30000);
      instance.reconnectTimeout = setTimeout(() => {
        if (instance.isActive && instance.subscribers.size > 0) {
          instance.subscribers.forEach((sub) => sub.onReconnect?.());
          instance.isActive = false;
          startStream(instance);
        }
      }, instance.reconnectDelay);
    }
  };

  run();
}

function stopStream(instance: StreamInstance) {
  instance.isActive = false;
  if (instance.reconnectTimeout) {
    clearTimeout(instance.reconnectTimeout);
    instance.reconnectTimeout = null;
  }
  if (instance.abortController) {
    instance.abortController.abort();
    instance.abortController = null;
  }
  activeStreams.delete(instance.ticketId);
}

export function useTicketStream(
  ticketId: string,
  options: UseTicketStreamOptions
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!ticketId || typeof window === "undefined") return;

    const instance = getOrCreateStream(ticketId);

    if (instance.teardownTimeout) {
      clearTimeout(instance.teardownTimeout);
      instance.teardownTimeout = null;
    }

    const subscriber: UseTicketStreamOptions = {
      onMessage: (msg) => optionsRef.current.onMessage?.(msg),
      onStatus: (st) => optionsRef.current.onStatus?.(st),
      onUpdate: (data) => optionsRef.current.onUpdate?.(data),
      onReconnect: () => optionsRef.current.onReconnect?.(),
    };

    instance.subscribers.add(subscriber);

    if (!instance.isActive) {
      startStream(instance);
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !instance.isActive && instance.subscribers.size > 0) {
        if (instance.reconnectTimeout) {
          clearTimeout(instance.reconnectTimeout);
          instance.reconnectTimeout = null;
        }
        startStream(instance);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      instance.subscribers.delete(subscriber);

      if (instance.subscribers.size === 0) {
        instance.teardownTimeout = setTimeout(() => {
          if (instance.subscribers.size === 0) {
            stopStream(instance);
          }
        }, 300);
      }
    };
  }, [ticketId]);
}
