/**
 * Root Non-Locale 404 Route Handler
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

import { RootNotFoundView } from '@/components/error';

export default function GlobalNotFound() {
  return <RootNotFoundView />;
}
