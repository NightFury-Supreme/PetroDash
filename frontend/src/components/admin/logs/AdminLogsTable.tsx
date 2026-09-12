import React from 'react';
import { SharedLogsTable, LogEntry } from '@/components/ui/SharedLogsTable';

export function AdminLogsTable({ logs, loading }: { logs: any[], loading: boolean }) {
  return <SharedLogsTable logs={logs as LogEntry[]} loading={loading} variant="admin" />;
}
