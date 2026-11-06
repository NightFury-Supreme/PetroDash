export interface GiftResourceRewards {
  diskMb?: number;
  memoryMb?: number;
  cpuPercent?: number;
  backups?: number;
  databases?: number;
  allocations?: number;
  serverSlots?: number;
}

export interface GiftRewards {
  coins?: number;
  resources?: GiftResourceRewards;
  planIds?: string[];
}

export interface GiftCreatedBy {
  id: string;
  username: string;
  email?: string;
  profilePicture?: string;
}

export interface AdminGiftItem {
  id: string;
  code: string;
  description?: string;
  rewards?: GiftRewards;
  maxRedemptions?: number;
  redeemedCount: number;
  validFrom?: string | null;
  validUntil?: string | null;
  enabled: boolean;
  createdBy?: GiftCreatedBy | null;
  source: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface GiftPagination {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
}

export interface GiftListResponse {
  gifts: AdminGiftItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GiftRedemptionUser {
  id: string;
  username: string;
  email?: string;
  profilePicture?: string;
}

export interface GiftRedemptionItem {
  user: GiftRedemptionUser;
  redeemedAt: string;
}

export interface GiftRedemptionsResponse {
  code: string;
  redemptions: GiftRedemptionItem[];
  pagination: GiftPagination;
}
