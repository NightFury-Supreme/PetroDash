/* ==========================================================================
   Admin Servers Types
   Compliance: ISO/IEC 25010, Strong Typing
========================================================================== */

import React from 'react';

export type ServerLimits = {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
};

export type AdminServer = {
  _id: string;
  name: string;
  status: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    oauthProviders?: {
      discord?: { avatar?: string };
      google?: { picture?: string };
    };
  };
  egg: {
    _id: string;
    name: string;
    icon?: string;
  };
  location: {
    _id: string;
    name: string;
    flag?: string;
  };
  limits: ServerLimits;
  createdAt: string;
  clientUrl?: string;
  suspended?: boolean;
  unreachable?: boolean;
  priority?: number;
  identifier?: string;
  uuid?: string;
  panelUrl?: string;
};

export interface AdminServerTableRowProps {
  server: AdminServer;
  onDelete: (serverId: string, serverName: string) => void;
  onEdit: (serverId: string) => void;
  deleting: string | null;
  hideOwner?: boolean;
}

export interface AdminServersTableProps {
  servers: AdminServer[];
  onDelete: (serverId: string, serverName: string) => void;
  onEdit: (serverId: string) => void;
  deleting: string | null;
  hideOwner?: boolean;
}

export type ResourceFieldDef = {
  key: keyof ServerLimits;
  label: string;
  icon: React.ElementType;
  unit: string;
};
