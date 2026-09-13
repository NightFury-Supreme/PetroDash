export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, retries: number = 2, backoffMs: number = 400): Promise<Response> {
  const isGet = !init?.method || init.method.toUpperCase() === 'GET';
  const cacheKey = isGet ? `${String(input)}_${init?.headers ? JSON.stringify(init.headers) : ''}` : null;

  // Deduplicate concurrent identical GET requests
  if (cacheKey) {
    const _win = window as any;
    _win.__fetchDedup = _win.__fetchDedup || new Map();
    if (_win.__fetchDedup.has(cacheKey)) {
      const p = _win.__fetchDedup.get(cacheKey);
      const res = await p;
      return res.clone(); // Clone so multiple callers can read the body
    }
  }

  const doFetch = async () => {
    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), (init as any)?.timeoutMs || 10000);
        const res = await fetch(input, { ...init, signal: controller.signal });
        clearTimeout(timeout);
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
            continue;
          }
        }
        return res;
      } catch (e) {
        lastError = e;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
          continue;
        }
        throw e;
      }
    }
    throw lastError || new Error('Request failed');
  };

  if (!cacheKey) return doFetch();

  const promise = doFetch();
  const _win = window as any;
  _win.__fetchDedup.set(cacheKey, promise);
  
  try {
    const res = await promise;
    // Keep in cache for 500ms to collapse rapid subsequent calls
    setTimeout(() => {
      _win.__fetchDedup.delete(cacheKey);
    }, 500);
    return res.clone();
  } catch (e) {
    _win.__fetchDedup.delete(cacheKey);
    throw e;
  }
}
