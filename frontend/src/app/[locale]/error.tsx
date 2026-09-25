/**
 * Localized Runtime Error Boundary Handler
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

'use client';

import { ErrorBoundaryView } from '@/components/error';

export default function LocalizedErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryView error={error} reset={reset} />;
}
