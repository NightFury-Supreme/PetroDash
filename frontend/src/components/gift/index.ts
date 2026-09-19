/* ==========================================================================
   Gift — Shared API Export (Barrel)
   Encapsulates all gift-related UI logic in one place for enterprise scale
========================================================================== */

export type { GiftCode, GiftRewards, GiftCodesPageMeta, TabStatus } from "./types";

export { useGiftCodes } from "./hooks/useGiftCodes";
export { useRedeemGift } from "./hooks/useRedeemGift";
export { useCreateGift } from "./hooks/useCreateGift";

export { GiftCodeRow } from "./GiftCodeRow";
export { GiftCodesSection } from "./GiftCodesSection";
export { GiftRedeemSection } from "./GiftRedeemSection";
export { GiftCreateDrawer } from "./GiftCreateDrawer";
