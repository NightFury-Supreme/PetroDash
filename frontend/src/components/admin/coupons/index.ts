/* ==========================================================================
   Admin Coupons Module Barrel
   Compliance: ISO/IEC 25010, Clean Architecture, Encapsulation
========================================================================== */

export { CouponsHeader } from "./CouponsHeader";
export { CouponsList } from "./CouponsList";
export { AdminCouponItemRow } from "./AdminCouponItemRow";
export { CouponsPageContent } from "./CouponsPageContent";

export { AdminCreateCouponDrawer } from "./drawers/AdminCreateCouponDrawer";
export { AdminEditCouponDrawer } from "./drawers/AdminEditCouponDrawer";
export { AdminDeleteCouponDrawer } from "./drawers/AdminDeleteCouponDrawer";

export type {
  AdminCouponItem,
  CouponPagination,
  CouponsListResponse,
  CreateCouponPayload,
  UpdateCouponPayload,
} from "./types";
