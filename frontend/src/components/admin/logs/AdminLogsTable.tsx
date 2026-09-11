import React from 'react';
import { SharedLogsTable, SharedLog } from '@/components/ui/SharedLogsTable';

export function AdminLogsTable({ logs, loading }: { logs: any[], loading: boolean }) {
  return <SharedLogsTable logs={logs as SharedLog[]} loading={loading} variant="admin" />;
}
