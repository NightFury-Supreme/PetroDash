/* ==========================================================================
   Banned Page Route Loading State
   Compliance: ISO/IEC 25010 (Single Responsibility Principle)
========================================================================== */

import { BannedSkeleton } from '@/components/banned';

export default function BannedLoading() {
  return <BannedSkeleton />;
}
