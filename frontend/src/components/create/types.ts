export type Step = 'name' | 'egg' | 'location' | 'resources';

export interface StepInfo {
  id: Step;
  title: string;
  description: string;
}

export interface Egg {
  _id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  serverCount?: number;
}

export interface Location {
  _id: string;
  name: string;
  flagUrl: string;
  latencyUrl: string;
  serverLimit: number;
  platform: {
    platformLocationId: string;
    swapMb: number;
    blockIoWeight: number;
    cpuPinning: string;
  };
  createdAt: string;
  updatedAt: string;
  ping?: number;
  serverCount?: number;
}

export interface FormData {
  name: string;
  eggId: string;
  locationId: string;
  diskMb: string;
  memoryMb: string;
  cpuPercent: string;
  backups: string;
  databases: string;
  allocations: string;
}

export interface ResourceLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
  serverSlots: number;
}

export interface Violations {
  name?: string;
  eggId?: string;
  locationId?: string;
  diskMb?: string;
  memoryMb?: string;
  cpuPercent?: string;
  backups?: string;
  databases?: string;
  allocations?: string;
}
