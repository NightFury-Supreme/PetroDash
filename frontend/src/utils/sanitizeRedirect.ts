/**
 * Open-Redirect & Path-Traversal Protection Utility
 *
 * Implements OWASP ASVS V5.1 (Input Validation) & ASVS V13.1 (API Architecture).
 * Validates that redirect parameters represent safe, same-origin relative paths
 * within the application, strictly preventing external open redirects, protocol
 * bypasses (e.g. /\evil.com, /https://evil.com, //evil.com), and authentication loops.
 */

const BLOCKED_AUTH_PATHS = [
  '/login',
  '/register',
  '/auth/callback',
  '/auth/',
];

/**
 * Sanitizes a redirect destination string.
 *
 * @param raw - The untrusted raw redirect query parameter string
 * @param defaultPath - Fallback safe destination (default: '/dashboard')
 * @returns A safe root-relative path (e.g. '/dashboard', '/admin', '/servers')
 */
export function sanitizeRedirect(
  raw: string | null | undefined,
  defaultPath = '/dashboard'
): string {
  if (!raw || typeof raw !== 'string') {
    return defaultPath;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed === '/' || trimmed === defaultPath) {
    return defaultPath;
  }

  try {
    // Multi-pass URL decoding (up to 3 levels) to neutralize double/triple percent-encoding bypasses
    let decoded = trimmed;
    for (let i = 0; i < 3; i++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      } catch {
        break;
      }
    }

    // 1. Must start with a single forward slash; reject double-slash protocol-relative URLs
    if (!decoded.startsWith('/') || decoded.startsWith('//')) {
      return defaultPath;
    }

    // 2. Reject backslashes anywhere in the target (defends against /\evil.com, /%5C, etc.)
    if (decoded.includes('\\')) {
      return defaultPath;
    }

    // 3. Reject scheme indicators, pseudo-schemes, credentials, and external host prefixes
    // e.g., /https://google.com, /http://evil.com, /javascript:, //google.com, /@evil.com
    if (
      /[:@]/.test(decoded) ||
      /^\/(https?:|\/\/|www\.)/i.test(decoded) ||
      decoded.includes('://')
    ) {
      return defaultPath;
    }

    // 4. Reject control characters, newlines, and null bytes (defends against header injection)
    if (/[\x00-\x1F\x7F]/.test(decoded)) {
      return defaultPath;
    }

    // 5. Parse using the URL constructor against a fixed dummy origin to ensure structural validity
    const dummyOrigin = 'https://dashboard.petrodash.internal';
    const parsed = new URL(decoded, dummyOrigin);

    if (parsed.origin !== dummyOrigin) {
      return defaultPath;
    }

    const cleanPath = parsed.pathname + parsed.search + parsed.hash;

    // 6. Ensure cleanPath is non-empty, root-relative, and contains no scheme delimiters
    if (!cleanPath.startsWith('/') || cleanPath.startsWith('//') || /[:@\\]/.test(cleanPath)) {
      return defaultPath;
    }

    // 7. Prevent authentication loops (e.g. redirecting to /login or /register)
    const lower = cleanPath.toLowerCase();
    for (const blocked of BLOCKED_AUTH_PATHS) {
      if (lower === blocked || lower.startsWith(`${blocked}/`) || lower.startsWith(`${blocked}?`)) {
        return defaultPath;
      }
    }

    return cleanPath;
  } catch {
    return defaultPath;
  }
}
