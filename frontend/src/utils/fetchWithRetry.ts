export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, retries: number = 2, backoffMs: number = 400): Promise<Response> {
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
}


