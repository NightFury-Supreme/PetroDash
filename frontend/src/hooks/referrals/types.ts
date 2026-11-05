export type ReferralStatus = "Earned" | "Pending";

export interface ReferralUser {
  readonly name: string;
  readonly email: string;
  readonly joinedAt: string;
  readonly reward: number;
  readonly status: ReferralStatus;
}

export interface ReferralStats {
  coinsEarned: number;
  code: string;
  link: string;
  canCustomize: boolean;
  minInvites: number;
  referredCount: number;
  referrerCoins: number;
}

export interface ReferralUsersPage {
  users: ReferralUser[];
  total: number;
}

export type SaveStatus = "idle" | "loading" | "success" | "error";
