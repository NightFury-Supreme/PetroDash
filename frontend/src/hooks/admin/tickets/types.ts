/* ==========================================================================
   Admin Tickets Types
   Compliance: ISO/IEC 25010 (Strong Typing, Interface Segregation)
========================================================================== */

export interface TicketAuthor {
  _id?: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  oauthProviders?: {
    discord?: { avatar?: string };
    google?: { picture?: string };
  };
}

export interface AdminTicketItemData {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  deletedByUser?: boolean;
  user?: TicketAuthor;
  assignee?: TicketAuthor;
}

export interface TicketMessageData {
  _id: string;
  ticket?: string;
  body: string;
  authorRole: string;
  internal?: boolean;
  createdAt: string;
  author?: TicketAuthor;
  userId?: TicketAuthor | string;
}

export interface TicketCounts {
  all: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  deleted: number;
}
