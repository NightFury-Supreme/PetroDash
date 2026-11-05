export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketAction = 'reopen' | 'resolved' | 'resolve' | 'close' | 'delete' | 'restore';
export type Priority     = 'Low' | 'Medium' | 'High';

export interface SupportTicket {
  id:           string;
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
  id:         string;
  ticket?:     string;
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

export interface TicketCounts {
  all: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
}

export interface TicketPaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-white/30',
  medium: 'bg-yellow-500',
  high:   'bg-[#FF5722]',
};
