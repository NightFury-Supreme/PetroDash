/* ==========================================================================
   Admin Coupons Domain Types
   Compliance: ISO/IEC 25010, Strong Typing, Clean Architecture
========================================================================== */

export interface AdminCouponItem {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxRedemptions?: number;
  redeemedCount: number;
  validFrom?: string | null;
  validUntil?: string | null;
  appliesToPlanIds?: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponPagination {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
}

export interface CouponsListResponse {
  coupons: AdminCouponItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCouponPayload {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  validFrom: string | null;
  validUntil: string | null;
  maxRedemptions: number;
  appliesToPlanIds: string[];
  enabled: boolean;
}

export interface UpdateCouponPayload {
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  validFrom?: string | null;
  validUntil?: string | null;
  maxRedemptions?: number;
  appliesToPlanIds?: string[];
  enabled?: boolean;
}
