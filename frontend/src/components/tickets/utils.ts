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
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

export function getToken(): string {
  return typeof window !== 'undefined'
    ? (localStorage.getItem('auth_token') || '')
    : '';
}

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
