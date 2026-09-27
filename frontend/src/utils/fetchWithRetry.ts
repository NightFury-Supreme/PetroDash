/* ==========================================================================
   fetchWithRetry Utility
   Compliance: ISO/IEC 25010 (Fault Tolerance, Resilience, Rate-Limit Backoff)
========================================================================== */

export interface FetchWithRetryInit extends RequestInit {
  timeoutMs?: number;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: FetchWithRetryInit,
  retries: number = 2,
  backoffMs: number = 400
): Promise<Response> {
  const isGet = !init?.method || init.method.toUpperCase() === 'GET';
  const cacheKey = isGet ? `${String(input)}_${init?.headers ? JSON.stringify(init.headers) : ''}` : null;

  // Deduplicate concurrent identical GET requests
  if (cacheKey && typeof window !== 'undefined') {
    const _win = window as unknown as { __fetchDedup?: Map<string, Promise<Response>> };
    _win.__fetchDedup = _win.__fetchDedup || new Map();
    if (_win.__fetchDedup.has(cacheKey)) {
      const p = _win.__fetchDedup.get(cacheKey)!;
      const res = await p;
      return res.clone();
    }
  }

  const doFetch = async () => {
    let lastError: unknown = null;
    const timeoutLimit = init?.timeoutMs || 15000;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          try {
            controller.abort(new Error('ERR_SERVER_TIMEOUT'));
          } catch {
            controller.abort();
          }
        }, timeoutLimit);
        const res = await fetch(input, { ...init, signal: controller.signal });
        clearTimeout(timeout);

        // Global event dispatch for Account Banned responses
        if (res.status === 403 && typeof window !== 'undefined') {
          try {
            const clone = res.clone();
            const body = await clone.json().catch(() => null);
            if (body?.error === 'ERR_ACCOUNT_BANNED') {
              try {
                sessionStorage.setItem('is_banned', 'true');
                if (body?.details?.reason) sessionStorage.setItem('ban_reason', String(body.details.reason));
                if (body?.details?.until) sessionStorage.setItem('ban_until', String(body.details.until));
                if (body?.details?.username) sessionStorage.setItem('ban_username', String(body.details.username));
              } catch {
                // Ignore storage failures in restricted contexts
              }
              window.dispatchEvent(new CustomEvent('account:banned', { detail: body?.details }));
            }
          } catch {
            // Ignore clone errors
          }
        }

        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
            continue;
          }
        }
        return res;
      } catch (e: unknown) {
        lastError = e;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
          continue;
        }
        const errObj = e as { name?: string; message?: string };
        if (errObj?.name === 'AbortError' || errObj?.message?.toLowerCase().includes('aborted')) {
          const timeoutErr = new Error('ERR_SERVER_TIMEOUT');
          timeoutErr.name = 'AbortError';
          throw timeoutErr;
        }
        throw e;
      }
    }
    throw (lastError as Error) || new Error('ERR_NETWORK');
  };

  if (!cacheKey) return doFetch();

  const promise = doFetch();
  if (typeof window !== 'undefined') {
    const _win = window as unknown as { __fetchDedup?: Map<string, Promise<Response>> };
    _win.__fetchDedup = _win.__fetchDedup || new Map();
    _win.__fetchDedup.set(cacheKey, promise);
  }

  try {
    const res = await promise;
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const _win = window as unknown as { __fetchDedup?: Map<string, Promise<Response>> };
        _win.__fetchDedup?.delete(cacheKey);
      }
    }, 500);
    return res.clone();
  } catch (e) {
    if (typeof window !== 'undefined') {
      const _win = window as unknown as { __fetchDedup?: Map<string, Promise<Response>> };
      _win.__fetchDedup?.delete(cacheKey);
    }
    throw e;
  }
}
