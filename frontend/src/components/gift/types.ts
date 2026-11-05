export type TabStatus = "Active" | "Inactive";

export interface GiftRewards {
  readonly coins?: number;
  readonly resources?: {
    readonly diskMb?: number;
    readonly memoryMb?: number;
    readonly cpuPercent?: number;
    readonly allocations?: number;
    readonly backups?: number;
    readonly databases?: number;
    readonly serverSlots?: number;
  };
}

export interface GiftCode {
  readonly id: string;
  readonly code: string;
  readonly description?: string;
  readonly validUntil?: string;
  readonly redeemedCount?: number;
  readonly maxRedemptions?: number;
  readonly rewards?: GiftRewards;
  readonly status: TabStatus;
}

export interface GiftCodesPageMeta {
  readonly total: number;
  readonly activeCount: number;
  readonly inactiveCount: number;
}
