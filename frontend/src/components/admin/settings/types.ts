export interface Settings {
  siteName: string;
  siteIcon: string;
  payments: {
    smtp: {
      enabled?: boolean;
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
      fromEmail: string;
    };
    paypal: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      webhookId: string;
    };
  };
  localization?: {
    currency: string;
    timezone?: string;
  };
  auth: {
    emailLogin: boolean;
    emailVerification: boolean;
    discord: {
      enabled: boolean;
      autoJoin: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
      botToken: string;
      guildId: string;
    };
    google: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
    };
  };
  defaults: {
    cpuPercent: number;
    memoryMb: number;
    diskMb: number;
    serverSlots: number;
    backups: number;
    allocations: number;
    databases: number;
    coins: number;
  };
  referrals?: { referrerCoins?: number; referredCoins?: number; customCodeMinInvites?: number };
  adsense?: {
    enabled: boolean;
    publisherId: string;
    adSlots: {
      header: string;
      sidebar: string;
      footer: string;
      content: string;
      mobile: string;
    };
    adTypes: {
      display: boolean;
      text: boolean;
      link: boolean;
      inFeed: boolean;
      inArticle: boolean;
      matchedContent: boolean;
    };
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: NonNullable<T[P]> extends (infer U)[]
    ? DeepPartial<U>[]
    : NonNullable<T[P]> extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : NonNullable<T[P]> extends object
    ? DeepPartial<NonNullable<T[P]>>
    : T[P];
};

export interface AdminSettingsContentProps {
  settings?: Settings;
  loading?: boolean;
  onSave?: (settings: DeepPartial<Settings>) => Promise<Settings>;
}

export interface TabProps {
  formData: Settings;
  updateFormData: (path: string, value: unknown) => void;
  saveSection: (patch: DeepPartial<Settings>, msg: string) => Promise<void>;
  loading: boolean;
}
