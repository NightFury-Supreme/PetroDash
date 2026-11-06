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
