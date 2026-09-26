import React from 'react';
import { SharedLogsTable, LogEntry } from '@/components/ui/SharedLogsTable';
import type { AuditLog } from '@/hooks/admin/logs';

interface AdminLogsTableProps {
  logs: AuditLog[];
  loading: boolean;
}

export function AdminLogsTable({ logs, loading }: AdminLogsTableProps) {
  return <SharedLogsTable logs={logs as unknown as LogEntry[]} loading={loading} variant="admin" />;
}
