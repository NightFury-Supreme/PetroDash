import type { AdminUserListItem } from './types';

export type UserTab = 'all' | 'active' | 'banned' | 'admins';

export interface AdminUserPagination {
  page: number;
  totalPages: number;
  total: number;
}

export interface TabDataState {
  users: AdminUserListItem[];
  pagination: AdminUserPagination;
  loaded: boolean;
}

export const emptyTab = (): TabDataState => ({
  users: [],
  pagination: { page: 1, totalPages: 1, total: 0 },
  loaded: false,
});

export const memoryTabCache: Record<UserTab, TabDataState> = {
  all: emptyTab(),
  active: emptyTab(),
  banned: emptyTab(),
  admins: emptyTab(),
};

export const inFlightRequests = new Map<string, Promise<void>>();

export function applyBanToTabCache(
  prev: Record<UserTab, TabDataState>,
  user: AdminUserListItem,
  isCurrentlyBanned: boolean,
  options?: { reason?: string; durationMinutes?: number }
): Record<UserTab, TabDataState> {
  const next = { ...prev };
  const allTabs: UserTab[] = ['all', 'active', 'banned', 'admins'];

  for (const tabKey of allTabs) {
    const tabData = next[tabKey];
    if (!tabData.loaded) continue;

    if (tabKey === 'active' && !isCurrentlyBanned) {
      next.active = {
        ...tabData,
        users: tabData.users.filter((u) => u.id !== user.id),
        pagination: { ...tabData.pagination, total: Math.max(0, tabData.pagination.total - 1) },
      };
    } else if (tabKey === 'banned' && isCurrentlyBanned) {
      next.banned = {
        ...tabData,
        users: tabData.users.filter((u) => u.id !== user.id),
        pagination: { ...tabData.pagination, total: Math.max(0, tabData.pagination.total - 1) },
      };
    } else {
      next[tabKey] = {
        ...tabData,
        users: tabData.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                ban: {
                  ...u.ban,
                  isBanned: !isCurrentlyBanned,
                  reason: !isCurrentlyBanned ? (options?.reason || '') : '',
                  until:
                    !isCurrentlyBanned && options?.durationMinutes
                      ? new Date(Date.now() + options.durationMinutes * 60000).toISOString()
                      : null,
                },
              }
            : u
        ),
      };
    }
    memoryTabCache[tabKey] = next[tabKey];
  }
  return next;
}

export function applyDeleteToTabCache(
  prev: Record<UserTab, TabDataState>,
  userId: string
): Record<UserTab, TabDataState> {
  const next = { ...prev };
  const allTabs: UserTab[] = ['all', 'active', 'banned', 'admins'];

  for (const tabKey of allTabs) {
    const tabData = next[tabKey];
    if (!tabData.loaded) continue;
    next[tabKey] = {
      ...tabData,
      users: tabData.users.filter((u) => u.id !== userId),
      pagination: { ...tabData.pagination, total: Math.max(0, tabData.pagination.total - 1) },
    };
    memoryTabCache[tabKey] = next[tabKey];
  }
  return next;
}
