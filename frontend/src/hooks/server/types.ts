export interface ResourceLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
}

export interface CreateResourceLimits extends ResourceLimits {
  serverSlots: number;
}

export interface UserLimits extends ResourceLimits {
  serverSlots?: number;
}


export interface EggOption {
  _id: string;
  name: string;
  description: string;
  dockerImage: string;
  category: string;
  categoryName?: string;
  minimumCpu: number;
  minimumMemory: number;
  minimumDisk: number;
  isPlanAllowed?: boolean;
  allowedPlanNames?: string[];
  icon?: string;
  recommended?: boolean;
  serverCount?: number;
}

export interface LocationOption {
  _id: string;
  name: string;
  shortCode: string;
  description: string;
  flagUrl: string;
  flag?: string;
  isPlanAllowed?: boolean;
  allowedPlanNames?: string[];
  ping?: number | null;
  serverCount?: number;
  serverLimit?: number;
}

export interface CreateFormData {
  name: string;
  eggId: string;
  locationId: string;
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
}

export interface ServerEditData {
  _id: string;
  name: string;
  status: string;
  limits: ResourceLimits;
  panelServerId: string;
  createdAt: string;
  updatedAt: string;
  unreachable?: boolean;
  error?: string;
  suspended?: boolean;
  location?: string;
  locationFlag?: string;
  eggName?: string;
  eggIcon?: string;
  uuid?: string;
}

export interface ServerEditFormData extends ResourceLimits {
  name: string;
}

export interface Violations {
  [key: string]: string;
}

export interface UseServerEditReturn {
  loading: boolean;
  server: ServerEditData | null;
  userLimits: UserLimits | null;
  usage: ResourceLimits;
  form: ServerEditFormData;
  violations: Violations;
  error: string | null;
  saving: boolean;
  remaining: ResourceLimits;
  exceeds: Record<keyof ResourceLimits, boolean>;
  isFormValid: boolean;
  setForm: React.Dispatch<React.SetStateAction<ServerEditFormData>>;
  handleSave: (e: React.FormEvent) => Promise<boolean>;
  loadData: () => Promise<void>;
}

