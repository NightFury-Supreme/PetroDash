import { useEffect, useRef } from 'react';

export interface ServerStreamEvent {
  type: 'SERVER_CREATED' | 'SERVER_UPDATED' | 'SERVER_DELETED' | 'SERVER_ACTIVE' | string;
  serverId?: string;
  [key: string]: unknown;
}

const subscribers = new Set<(event: ServerStreamEvent) => void>();
let subscriberCount = 0;
let streamAbortController: AbortController | null = null;
let teardownTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 2000;
let isStreamActive = false;

function scheduleReconnect() {
  if (subscriberCount === 0 || reconnectTimeout) return;
  const jitter = Math.random() * 1000;
  reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    startSharedStream();
  }, reconnectDelay + jitter);
}

function startSharedStream() {
  if (isStreamActive || subscriberCount === 0) return;

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return;

  isStreamActive = true;
  streamAbortController = new AbortController();
  const currentAbortController = streamAbortController;

  const runStream = async () => {
    let stabilityTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
      const response = await fetch(`${apiBase}/api/servers/stream`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: currentAbortController.signal,
      });

      if (response.status === 401 || response.status === 403) {
        stopSharedStream();
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error('STREAM_CONNECT_FAILED');
      }

      stabilityTimer = setTimeout(() => {
        reconnectDelay = 2000;
      }, 30000);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (streamAbortController === currentAbortController) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
          if (dataLine) {
            const rawData = dataLine.slice(6).trim();
            try {
              const payload = JSON.parse(rawData);
              if (payload?.type && payload.type !== 'CONNECTED') {
                subscribers.forEach((cb) => cb(payload));
              }
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    } finally {
      if (stabilityTimer) {
        clearTimeout(stabilityTimer);
        stabilityTimer = null;
      }
      if (streamAbortController === currentAbortController) {
        isStreamActive = false;
        streamAbortController = null;
      }
    }

    if (subscriberCount > 0 && !isStreamActive) {
      scheduleReconnect();
    }
  };

  runStream();
}

function stopSharedStream() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (streamAbortController) {
    streamAbortController.abort();
    streamAbortController = null;
  }
  isStreamActive = false;
}

export function useServerStream(onEvent: (event: ServerStreamEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    subscriberCount++;

    if (teardownTimeout) {
      clearTimeout(teardownTimeout);
      teardownTimeout = null;
    }

    const listener = (event: ServerStreamEvent) => {
      if (isMounted) {
        onEventRef.current(event);
      }
    };

    subscribers.add(listener);

    if (!isStreamActive) {
      startSharedStream();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isStreamActive && subscriberCount > 0) {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        startSharedStream();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      subscribers.delete(listener);
      subscriberCount--;

      if (subscriberCount === 0) {
        teardownTimeout = setTimeout(() => {
          if (subscriberCount === 0) {
            stopSharedStream();
          }
        }, 200);
      }
    };
  }, []);
}
