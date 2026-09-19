/* ==========================================================================
   Referrals — Public barrel export
   All consumers import from "@/components/referrals" — never from deep paths
========================================================================== */

// Types
export type { ReferralUser, ReferralStats, ReferralUsersPage, SaveStatus, ReferralStatus } from "./types";

// Hooks
export { useReferralStats } from "./hooks/useReferralStats";
export { useReferralUsers } from "./hooks/useReferralUsers";
export { useReferralCode } from "./hooks/useReferralCode";

// UI Components
export { SummaryItem } from "./SummaryItem";
export { ReferralRow } from "./ReferralRow";
export { ReferralHeader } from "./components/ReferralHeader";
export { ReferralsSummarySection } from "./components/ReferralsSummarySection";
export { ReferralLinkCard } from "./components/ReferralLinkCard";
export { CustomReferralCode } from "./components/CustomReferralCode/CustomReferralCode";
export { ReferredUsersTable } from "./components/ReferredUsersTable";
