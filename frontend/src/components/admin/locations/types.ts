/**
 * Admin Locations Types
 */

export interface PlatformSettings {
  platformLocationId?: string;
  swapMb?: number;
  blockIoWeight?: number;
  cpuPinning?: string;
}

export interface AdminLocation {
  _id: string;
  name: string;
  flag?: string;
  latencyUrl?: string;
  serverLimit?: number;
  serversCount?: number;
  platform?: PlatformSettings;
  allowedPlans?: string[];
  allowedPlanNames?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationFormData {
  name: string;
  flag: string;
  latencyUrl: string;
  serverLimit: string;
  platformLocationId: string;
  swapMb: string;
  blockIoWeight: string;
  cpuPinning: string;
  allowedPlans: string[];
}

export interface PlanOption {
  _id?: string;
  id?: string;
  name?: string;
  pricePerMonth?: number;
  currency?: string;
}

export type LocationStep = 'basic' | 'platform' | 'permissions';
