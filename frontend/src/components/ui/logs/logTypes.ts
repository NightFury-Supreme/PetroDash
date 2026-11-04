export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'info' | 'warning' | 'error' | 'critical';
export type Variant  = 'user' | 'admin';
export type ActorType = 'self' | 'staff' | 'system' | 'user';

export interface LogMeta {
  changes?:    Record<string, unknown>;
  changed?:    Record<string, unknown>;
  created?:    Record<string, unknown>;
  sessionId?:  string;
  ip?:         string;
  userAgent?:  string;
  method?:     string;
  path?:       string;
  status?:     string;
  statusCode?: number;
  durationMs?: number;
  userId?:     string;
  username?:   string;
  serverName?: string;
  planName?:   string;
  subject?:    string;
  itemName?:   string;
  code?:       string;
  reason?:     string;
  targetName?: string;
  targetRole?: string;
  targetUsername?: string;
  targetEmail?: string;
  banUntil?:   string | null;
  durationMinutes?: number | null;
  permanent?:  boolean;
  adminId?:    string;
  adminUsername?: string;
  adminRole?:  string;
  [key: string]: unknown;
}

export interface LogEntry {
  id:          string;
  action:       string;
  category?:    string;
  createdAt:    string;
  actorType?:   ActorType;
  ip?:          string | null;
  userAgent?:   string | null;
  location?:    string | null;
  success?:     boolean;
  severity?:    Severity;
  meta?:        LogMeta;
  metadata?:    LogMeta;
  actorId?:     string | null;
  actorRole?:   string | null;
  actorUsername?: string | null;
  resourceId?:  string | null;
  resourceType?: string | null;
  method?:      string | null;
  path?:        string | null;
  statusCode?:  number | null;
  durationMs?:  number | null;
  sessionId?:   string | null;
  targetUserId?: string | null;
}

export interface SharedLogsTableProps {
  logs:    LogEntry[];
  loading: boolean;
  variant: Variant;
}

export interface DiffValue {
  old: unknown;
  new: unknown;
}
