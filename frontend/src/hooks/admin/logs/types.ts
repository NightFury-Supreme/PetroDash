export interface AuditLog {
  _id: string;
  actorId?: string;
  actorRole: 'user' | 'admin';
  actorUsername?: string;
  action: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category?: string;
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
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface LogFilters {
  q: string;
  action: string;
  actorId: string;
  resourceType: string;
  requestId: string;
  severity: string;
}
