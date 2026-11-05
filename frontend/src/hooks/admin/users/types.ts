import type { LogEntry } from '@/components/ui/SharedLogsTable';

export interface UserResources {
  cpuPercent?: number;
  memoryMb?: number;
  diskMb?: number;
  serverLimit?: number;
  backups?: number;
  databases?: number;
  additionalAllocations?: number;
  [key: string]: number | undefined;
}

export interface UserBanData {
  isBanned: boolean;
  reason?: string;
  until?: string | null;
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | string;
  coins?: number;
  profilePicture?: string;
  serverCount?: number;
  createdAt: string;
  ban?: UserBanData;
  resources?: UserResources;
  [key: string]: unknown;
}

export interface UserPlanItem {
  id?: string;
  planId?: string | {
    id?: string;
    name?: string;
    pricePerMonth?: number;
    pricePerYear?: number;
  };
  expiresAt?: string | null;
  status?: string;
  [key: string]: unknown;
}

export interface UserReferralData {
  code: string;
  coinsEarned: number;
  referredCount: number;
  referredUsers: Array<{
    id?: string;
    username?: string;
    email?: string;
    createdAt?: string;
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface UserFormData {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  coins?: number;
  referralCode?: string;
  resources?: UserResources;
  ban?: UserBanData;
  emailVerified?: boolean;
  tfaEnabled?: boolean;
  [key: string]: unknown;
}

export interface AdminUserSession {
  id: string;
  device: string;
  deviceType: string;
  browser: string;
  ip: string;
  location?: string;
  lastActive: string;
  createdAt?: string;
  current?: boolean;
}

export interface InvoiceItem {
  id?: string;
  amount: number;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export type ActivityLogItem = LogEntry;

export interface AdminUserDetailData {
  user: UserFormData;
  servers?: Array<{
    id?: string;
    name?: string;
    identifier?: string;
    status?: string;
    [key: string]: unknown;
  }>;
  plans?: UserPlanItem[];
  referral?: UserReferralData;
  referrals?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: Array<Record<string, unknown>>;
  };
  ban?: UserBanData;
  [key: string]: unknown;
}
