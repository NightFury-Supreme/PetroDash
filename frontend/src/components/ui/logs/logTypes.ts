export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'info' | 'warning' | 'error' | 'critical';
export type Variant  = 'user' | 'admin';

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
  targetName?: string;
  targetRole?: string;
  adminId?:    string;
  adminUsername?: string;
  adminRole?:  string;
  performedByAdmin?: boolean;
  updatedByAdmin?: boolean;
  [key: string]: unknown;
}

export interface LogEntry {
  _id:          string;
  action:       string;
  category?:    string;
  createdAt:    string;
  ip?:          string;
  userAgent?:   string;
  success?:     boolean;
  severity?:    Severity;
  meta?:        LogMeta;
  metadata?:    LogMeta;
  actorId?:     string;
  actorRole?:   string;
  actorUsername?: string;
  resourceId?:  string;
  resourceType?: string;
  method?:      string;
  path?:        string;
  statusCode?:  number;
  durationMs?:  number;
  sessionId?:   string;
  targetUserId?: string;
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
