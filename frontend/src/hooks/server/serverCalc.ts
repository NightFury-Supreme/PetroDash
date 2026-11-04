import type { ResourceLimits, UserLimits, ServerEditFormData, Violations } from './types';

export const MIN_SERVER_LIMITS: ResourceLimits = {
  diskMb: 100,
  memoryMb: 128,
  cpuPercent: 10,
  backups: 0,
  databases: 0,
  allocations: 1,
};

export function calculateRemainingEditResources(
  userLimits: UserLimits | null,
  usage: ResourceLimits,
  serverLimits: ResourceLimits | undefined
): ResourceLimits {
  if (!userLimits || !serverLimits) {
    return { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 };
  }

  const otherServersUsage = {
    diskMb: Math.max(0, Number(usage.diskMb || 0) - Number(serverLimits.diskMb || 0)),
    memoryMb: Math.max(0, Number(usage.memoryMb || 0) - Number(serverLimits.memoryMb || 0)),
    cpuPercent: Math.max(0, Number(usage.cpuPercent || 0) - Number(serverLimits.cpuPercent || 0)),
    backups: Math.max(0, Number(usage.backups || 0) - Number(serverLimits.backups || 0)),
    databases: Math.max(0, Number(usage.databases || 0) - Number(serverLimits.databases || 0)),
    allocations: Math.max(0, Number(usage.allocations || 0) - Number(serverLimits.allocations || 0)),
  };

  return {
    diskMb: Math.max(0, Number(userLimits.diskMb || 0) - otherServersUsage.diskMb),
    memoryMb: Math.max(0, Number(userLimits.memoryMb || 0) - otherServersUsage.memoryMb),
    cpuPercent: Math.max(0, Number(userLimits.cpuPercent || 0) - otherServersUsage.cpuPercent),
    backups: Math.max(0, Number(userLimits.backups || 0) - otherServersUsage.backups),
    databases: Math.max(0, Number(userLimits.databases || 0) - otherServersUsage.databases),
    allocations: Math.max(0, Number(userLimits.allocations || 0) - otherServersUsage.allocations),
  };
}

export function calculateResourceExceeds(
  form: ServerEditFormData,
  remaining: ResourceLimits
): Record<keyof ResourceLimits, boolean> {
  return {
    diskMb: Number(form.diskMb) > remaining.diskMb,
    memoryMb: Number(form.memoryMb) > remaining.memoryMb,
    cpuPercent: Number(form.cpuPercent) > remaining.cpuPercent,
    backups: Number(form.backups) > remaining.backups,
    databases: Number(form.databases) > remaining.databases,
    allocations: Number(form.allocations) > remaining.allocations,
  };
}

export function calculateClientMinViolations(
  form: ServerEditFormData,
  minLimits: ResourceLimits,
  formatError: (key: string, value: number) => string
): Violations {
  const v: Violations = {};
  if (Number(form.diskMb) < minLimits.diskMb) v.diskMb = formatError('minDisk', minLimits.diskMb);
  if (Number(form.memoryMb) < minLimits.memoryMb) v.memoryMb = formatError('minMemory', minLimits.memoryMb);
  if (Number(form.cpuPercent) < minLimits.cpuPercent) v.cpuPercent = formatError('minCpu', minLimits.cpuPercent);
  if (Number(form.backups) < minLimits.backups) v.backups = formatError('minBackups', minLimits.backups);
  if (Number(form.databases) < minLimits.databases) v.databases = formatError('minDatabases', minLimits.databases);
  if (Number(form.allocations) < minLimits.allocations) v.allocations = formatError('minAllocations', minLimits.allocations);
  return v;
}
