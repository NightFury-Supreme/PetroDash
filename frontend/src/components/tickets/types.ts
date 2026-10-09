/* -- Ticket domain types ----------------------------------- */

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketAction = 'reopen' | 'resolved';
export type Priority     = 'Low' | 'Normal' | 'High';

export interface SupportTicket {
  _id:           string;
  title:         string;
  category?:     string;
  status:        TicketStatus;
  priority?:     string;
  createdAt:     string;
  updatedAt:     string;
  messageCount?: number;
  lastMessage?:  string;
  user?:         { username?: string; email?: string };
  deletedByUser?: boolean;
}

export interface TicketMessage {
  _id:         string;
  author?:     { username?: string; email?: string; profilePicture?: string };
  authorId?:   string;
  userId?:     { username?: string; email?: string; profilePicture?: string } | string;
  isAdmin?:    boolean;
  authorRole?: string;
  message?:    string;
  body?:       string;
  isInternal?: boolean;
  internal?:   boolean;
  createdAt:   string;
}

/* -- Shared UI config constants ---------------------------- */

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; dot: string; badge: string }
> = {
  open:     { label: 'Open',     dot: 'bg-emerald-500', badge: 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400' },
  pending:  { label: 'Pending',  dot: 'bg-yellow-500',  badge: 'border-yellow-500/20  bg-yellow-500/[0.06]  text-yellow-400'  },
  resolved: { label: 'Resolved', dot: 'bg-blue-400',    badge: 'border-blue-400/20    bg-blue-400/[0.06]    text-blue-400'    },
  closed:   { label: 'Closed',   dot: 'bg-white/20',    badge: 'border-white/10       bg-white/[0.03]       text-white/30'    },
};

export const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-white/30',
  normal: 'bg-yellow-500',
  high:   'bg-[#FF5722]',
};
