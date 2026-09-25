/**
 * Localized 404 Route Handler
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

'use client';

import { NotFoundView } from '@/components/error';

export default function LocalizedNotFound() {
  return <NotFoundView />;
}
