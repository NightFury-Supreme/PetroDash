export interface AuditLog {
  _id: string;
  actorId?: string;
  actorRole: 'user' | 'admin';
  actorUsername?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  targetUserId?: string;
  meta: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  success?: boolean;
  durationMs?: number;
  responsePreview?: string;
  createdAt: string;
}

export interface LogsResponse {
  list: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LogFilters {
  action: string;
  actorId: string;
  resourceType: string;
  requestId: string;
  severity: string;
}

