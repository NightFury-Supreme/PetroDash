import { TicketStatus } from './types';

/* -- Page title / description by status ------------------- */
export function getStatusTitle(status: TicketStatus | 'all'): string {
  switch (status) {
    case 'open':     return 'Open Tickets';
    case 'pending':  return 'Pending Tickets';
    case 'resolved': return 'Resolved Tickets';
    case 'closed':   return 'Closed Tickets';
    default:         return 'All Tickets';
  }
}

export function getStatusDescription(status: TicketStatus | 'all'): string {
  switch (status) {
    case 'open':     return 'Tickets awaiting support attention.';
    case 'pending':  return 'Tickets waiting for a response or more information.';
    case 'resolved': return 'Successfully resolved support requests.';
    case 'closed':   return 'Previously closed support requests.';
    default:         return 'Your recent support requests and conversations.';
  }
}

/* -- Relative time ----------------------------------------- */
export function formatRelative(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7)   return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/* -- Short ticket ID --------------------------------------- */
export function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

/* -- Auth token -------------------------------------------- */
export function getToken(): string {
  return typeof window !== 'undefined'
    ? (localStorage.getItem('auth_token') || '')
    : '';
}

/* -- API base ---------------------------------------------- */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
