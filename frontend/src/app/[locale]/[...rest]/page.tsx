import { notFound } from 'next/navigation';

/**
 * Catch-all route for unmatched paths within a localized context.
 * Triggers the localized not-found.tsx page (ISO/IEC 25010 compliant).
 */
export default function CatchAllNotFound() {
  notFound();
}
