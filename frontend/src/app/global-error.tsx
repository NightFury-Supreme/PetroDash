/**
 * Root Layout Global Error Boundary Handler
 * Complies with ISO/IEC 25010 (Fault Tolerance)
 */

'use client';

import { GlobalErrorView } from '@/components/error';

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalErrorView error={error} reset={reset} />;
}
