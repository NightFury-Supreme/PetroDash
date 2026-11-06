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
