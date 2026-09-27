/* ==========================================================================
   API Error Normalization & Formatting Helper
   Compliance: ISO/IEC 25010 (Fault Tolerance, Usability, i18n Resilience)
========================================================================== */

/**
 * Normalizes any error object, string, or code into a clean machine code or human string.
 * Strips out accidental namespace prefixes (e.g. "BackendErrors.", "GlobalErrors.")
 * caused by next-intl fallbacks or misconfigured error handlers.
 */
export function normalizeErrorCode(rawError: unknown): string {
  if (!rawError) return '';

  let code = '';
  if (typeof rawError === 'string') {
    code = rawError.trim();
  } else if (typeof rawError === 'object' && rawError !== null) {
    const errObj = rawError as {
      error?: string;
      code?: string;
      message?: string;
    };
    code = (errObj.error || errObj.code || errObj.message || '').trim();
  }

  // Strip namespace prefixes if present
  if (code.startsWith('BackendErrors.')) {
    code = code.replace(/^BackendErrors\./, '');
  } else if (code.startsWith('GlobalErrors.')) {
    code = code.replace(/^GlobalErrors\./, '');
  } else if (code.startsWith('ErrorState.')) {
    code = code.replace(/^ErrorState\./, '');
  } else if (code.startsWith('Common.')) {
    code = code.replace(/^Common\./, '');
  }

  return code;
}

/**
 * Transforms an unmapped machine code (e.g. ERR_SESSION_EXPIRED) into a human sentence
 * ("Session expired.") so users never see ugly raw technical error codes.
 */
export function formatErrorCodeFallback(code: string): string {
  if (!code) return '';
  if (!code.startsWith('ERR_')) return code;

  const words = code.replace(/^ERR_/, '').replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1) + '.';
}

export interface ErrorTranslators {
  tBackendErrors?: (key: string) => string;
  hasBackendError?: (key: string) => boolean;
  tGlobalErrors?: (key: string) => string;
  hasGlobalError?: (key: string) => boolean;
  tErrorState?: (key: string, values?: Record<string, string>) => string;
  tCommon?: (key: string) => string;
}

/**
 * Translates a normalized error string using available translation namespaces.
 */
export function resolveErrorMessage(
  rawInput: unknown,
  translators: ErrorTranslators
): string {
  const code = normalizeErrorCode(rawInput);
  if (!code) {
    return translators.tCommon?.('somethingWentWrong') || 'Something went wrong';
  }

  // 1. Direct match in BackendErrors
  if (translators.hasBackendError?.(code) && translators.tBackendErrors) {
    return translators.tBackendErrors(code);
  }

  // 2. Direct match in GlobalErrors
  if (translators.hasGlobalError?.(code) && translators.tGlobalErrors) {
    return translators.tGlobalErrors(code);
  }

  // 3. Known standard network/HTTP error mappings
  const lower = code.toLowerCase();
  if (
    lower === 'forbidden' ||
    lower === 'unauthorized' ||
    lower === 'access denied' ||
    code === 'ERR_FORBIDDEN' ||
    code === 'ERR_UNAUTHORIZED'
  ) {
    return translators.tErrorState?.('descForbidden') || 'You do not have permission to access this resource.';
  }

  if (lower === 'not found' || code === 'ERR_NOT_FOUND') {
    const item = translators.tCommon?.('item') || 'resource';
    return translators.tErrorState?.('descNotFound', { topic: item }) || 'The requested resource was not found.';
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    code === 'ERR_NETWORK'
  ) {
    return translators.tErrorState?.('descNetwork') || 'Unable to connect to the server. Please check your connection.';
  }

  if (
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    code === 'ERR_RATE_LIMIT'
  ) {
    return translators.tErrorState?.('descRateLimit') || 'Too many requests. Please slow down and try again later.';
  }

  if (code === 'ERR_SERVER_TIMEOUT') {
    if (translators.hasBackendError?.('ERR_SERVER_TIMEOUT') && translators.tBackendErrors) {
      return translators.tBackendErrors('ERR_SERVER_TIMEOUT');
    }
    return translators.tErrorState?.('descNetwork') || 'The server took too long to respond.';
  }

  if (code === 'ERR_INTERNAL_SERVER') {
    if (translators.hasBackendError?.('ERR_INTERNAL_SERVER') && translators.tBackendErrors) {
      return translators.tBackendErrors('ERR_INTERNAL_SERVER');
    }
    return translators.tCommon?.('somethingWentWrong') || 'Internal server error';
  }

  // 4. Humanize unmapped ERR_* codes or return as-is
  return formatErrorCodeFallback(code);
}
