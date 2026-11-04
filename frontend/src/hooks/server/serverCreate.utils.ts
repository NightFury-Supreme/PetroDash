import type {
  EggOption,
  LocationOption,
  CreateResourceLimits,
  CreateFormData,
  Violations,
  ResourceLimits,
} from './types';

export interface CreateServerMemoryCache {
  eggs: EggOption[];
  locations: LocationOption[];
  resources: CreateResourceLimits | null;
  usage: Partial<CreateResourceLimits & { servers: number }>;
  lastFetched: number;
}

export const MIN_CREATE_LIMITS: ResourceLimits = {
  diskMb: 100,
  memoryMb: 128,
  cpuPercent: 10,
  backups: 0,
  databases: 0,
  allocations: 1,
};

export function extractPlanTokens(plansData: unknown): Set<string> {
  if (!Array.isArray(plansData)) return new Set();
  const tokens = plansData
    .filter((p: { status?: string }) => !p.status || p.status === 'active')
    .flatMap((p: { planId?: { name?: string; id?: string } }) => {
      if (typeof p?.planId === 'object' && p?.planId !== null) {
        return [p.planId.name, p.planId.id];
      }
      return [];
    })
    .filter(Boolean) as string[];
  return new Set(tokens);
}

export function filterAllowedEggs(eggsData: EggOption[], planTokens: Set<string>): EggOption[] {
  return (eggsData || []).map((e: EggOption & { allowedPlans?: string[] }) => {
    const allowedPlans = Array.isArray(e.allowedPlans) ? e.allowedPlans : [];
    const isAllowed = allowedPlans.length === 0 || allowedPlans.some((ap: string) => planTokens.has(String(ap)));
    return {
      ...e,
      isPlanAllowed: isAllowed,
    };
  });
}

export function filterAllowedLocations(locsData: LocationOption[], planTokens: Set<string>): LocationOption[] {
  return (locsData || []).map((l: LocationOption & { allowedPlans?: string[] }) => {
    const allowedPlans = Array.isArray(l.allowedPlans) ? l.allowedPlans : [];
    const isAllowed = allowedPlans.length === 0 || allowedPlans.some((ap: string) => planTokens.has(String(ap)));
    return {
      ...l,
      isPlanAllowed: isAllowed,
    };
  });
}

export function computeRemainingResources(
  resources: CreateResourceLimits | null,
  usage: Partial<ResourceLimits & { servers: number }>
) {
  if (!resources) {
    return { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0, serverSlots: 0 };
  }
  return {
    diskMb: Math.max(0, resources.diskMb - (usage.diskMb || 0)),
    memoryMb: Math.max(0, resources.memoryMb - (usage.memoryMb || 0)),
    cpuPercent: Math.max(0, resources.cpuPercent - (usage.cpuPercent || 0)),
    backups: Math.max(0, resources.backups - (usage.backups || 0)),
    databases: Math.max(0, resources.databases - (usage.databases || 0)),
    allocations: Math.max(0, resources.allocations - (usage.allocations || 0)),
    serverSlots: Math.max(0, resources.serverSlots - (usage.servers || 0))
  };
}

export function computeExceeds(
  form: CreateFormData,
  remaining: ReturnType<typeof computeRemainingResources>
) {
  return {
    diskMb: form.diskMb > remaining.diskMb,
    memoryMb: form.memoryMb > remaining.memoryMb,
    cpuPercent: form.cpuPercent > remaining.cpuPercent,
    backups: form.backups > remaining.backups,
    databases: form.databases > remaining.databases,
    allocations: form.allocations > remaining.allocations,
  };
}

export function computeMinViolations(
  form: CreateFormData,
  tError: (key: string, values?: Record<string, string | number | Date>) => string
): Violations {
  const v: Violations = {};
  if (form.diskMb < MIN_CREATE_LIMITS.diskMb) v.diskMb = tError('minDisk', { value: MIN_CREATE_LIMITS.diskMb });
  if (form.memoryMb < MIN_CREATE_LIMITS.memoryMb) v.memoryMb = tError('minMemory', { value: MIN_CREATE_LIMITS.memoryMb });
  if (form.cpuPercent < MIN_CREATE_LIMITS.cpuPercent) v.cpuPercent = tError('minCpu', { value: MIN_CREATE_LIMITS.cpuPercent });
  if (form.backups < MIN_CREATE_LIMITS.backups) v.backups = tError('minBackups', { value: MIN_CREATE_LIMITS.backups });
  if (form.databases < MIN_CREATE_LIMITS.databases) v.databases = tError('minDatabases', { value: MIN_CREATE_LIMITS.databases });
  if (form.allocations < MIN_CREATE_LIMITS.allocations) v.allocations = tError('minAllocations', { value: MIN_CREATE_LIMITS.allocations });
  return v;
}

export interface CreationErrorResponse {
  error?: string | { code?: string; message?: string };
  violations?: Record<string, string>;
  details?: { fieldErrors?: Record<string, string[]>; errors?: Array<{ detail?: string; message?: string }> };
}

export function parseCreationErrorResponse(data: CreationErrorResponse): { errorCode: string; violations?: Record<string, string> } {
  let errorCode = 'ERR_PANEL_SERVER_CREATION_FAILED';
  let violations: Record<string, string> | undefined;

  if (data?.violations) {
    violations = data.violations;
  } else if (data?.details?.fieldErrors) {
    const v: Record<string, string> = {};
    for (const [k, errs] of Object.entries(data.details.fieldErrors)) {
      if (Array.isArray(errs) && errs.length > 0) v[k] = String(errs[0]);
    }
    violations = v;
  }

  if (data?.error) {
    errorCode = typeof data.error === 'object' ? data.error.code || data.error.message || errorCode : data.error;
  }

  return { errorCode, violations };
}
