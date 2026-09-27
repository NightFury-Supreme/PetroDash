/* ==========================================================================
   Banned Component Types
   Compliance: ISO/IEC 25010 (Single Responsibility Principle)
========================================================================== */

export interface BannedDetailsCardProps {
  reason: string;
  untilText: string | null;
}

export interface BannedActionsProps {
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  checking: boolean;
}
