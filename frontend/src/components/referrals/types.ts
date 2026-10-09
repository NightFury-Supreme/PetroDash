export type ReferralStatus = "Earned" | "Pending";

export type ReferralUser = {
  name: string;
  email: string;
  joinedAt: string;
  reward: number;
  status: ReferralStatus;
};
