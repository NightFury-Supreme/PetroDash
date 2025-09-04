export interface ServerInfo {
  _id: string;
  name: string;
  status: string;
  location: string;
  cpu: number;
  memory: number;
  storage: number;
  url: string;
  eggName?: string;
  eggIcon?: string;
  backups?: number;
  databases?: number;
  allocations?: number;
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

export interface ResourceUsage {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
  servers: number;
}
