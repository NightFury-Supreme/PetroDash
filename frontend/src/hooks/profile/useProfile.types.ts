export interface SessionItem {
  id: string;
  device: string;
  deviceType: string;
  browser: string;
  ip: string;
  location?: string;
  lastActive: string;
  createdAt?: string;
  current: boolean;
}

export type Session = SessionItem;

export interface ProfileFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  coins: number;
  joinedAt: string;
  loginMethod: string;
  oauthProviders: Record<string, unknown>;
  emailVerified: boolean;
  emailVerification: boolean;
  profilePicture: string;
  tfaEnabled: boolean;
  pterodactylUserId: string | null;
}

export interface UpdateProfilePayload {
  username?: string;
  firstName?: string;
  lastName?: string;
}
