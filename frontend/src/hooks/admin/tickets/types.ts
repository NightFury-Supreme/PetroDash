
export interface TicketAuthor {
  id?: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  oauthProviders?: {
    discord?: { avatar?: string };
    google?: { picture?: string };
  };
}

export interface AdminTicketItemData {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  deletedByUser?: boolean;
  tags?: string[];
  user?: TicketAuthor;
  assignee?: TicketAuthor | null;
}

export interface TicketMessageData {
  id: string;
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
