export interface AdminMetrics {
  totalUsers: number;
  usersTrend: string;
  activeServers: number;
  serversTrend: string;
  totalRevenue: number;
  revenueTrend: string;
  totalPlanPurchases: number;
  purchasesTrend: string;
  allTimeRevenue?: number;
  allTimePurchases?: number;
  allTimeUsers?: number;
  allTimeServers?: number;
  allTimeTickets?: number;
  allTimeReferrals?: number;
  allTimeActivePlans?: number;
  periodUsers?: number;
  periodServers?: number;
  periodTickets?: number;
  periodReferrals?: number;
  periodActivePlans?: number;
  deletedAccounts: number;
  deletedAccountsTrend: string;
  referrals: number;
  referralsTrend: string;
  activePlans: number;
  activePlansTrend: string;
  deletedServers: number;
  deletedServersTrend: string;
  locationsCount: number;
  locationsTrend?: string;
  eggsCount: number;
  eggsTrend?: string;
  avgOrder: number;
  avgOrderTrend: string;
  refunds: number;
  refundsTrend: string;
  totalTickets: number;
  totalTicketsTrend: string;
  openTickets: number;
  openTicketsTrend: string;
  pendingTickets: number;
  pendingTicketsTrend: string;
  resolvedTickets: number;
  resolvedTicketsTrend: string;
  avgResponseTime: string;
  avgResolutionTime: string;
}

export interface OverviewPoint {
  day: string;
  users: number;
  servers: number;
  purchases: number;
  revenue: number;
}

export interface UsersPoint {
  day: string;
  registered: number;
  deleted: number;
  referrals: number;
}

export interface InfrastructurePoint {
  day: string;
  created: number;
  deleted: number;
}

export interface FinancialPoint {
  day: string;
  revenue: number;
  purchases: number;
  refunds: number;
}

export interface TicketPoint {
  day: string;
  created: number;
  resolved: number;
  closed: number;
  reopened: number;
}

export interface ResponsePoint {
  day: string;
  response: number;
  resolution: number;
}

export interface DistributionItem {
  name: string;
  servers: number;
  percentage: number;
}

export interface PlanRevenueItem {
  name: string;
  purchases: number;
  revenue: number;
  percentage: number;
}

export interface TicketLifecycleItem {
  name: string;
  status: string;
  value: number;
  color: string;
  rawName?: string;
}

export interface DynamicChartPoint {
  day: string;
  [key: string]: string | number;
}

export interface AdminStatsResponse {
  metrics: AdminMetrics;
  overviewData: OverviewPoint[];
  usersData: UsersPoint[];
  infrastructureData: InfrastructurePoint[];
  financialData: FinancialPoint[];
  planPurchaseData: DynamicChartPoint[];
  ticketData: TicketPoint[];
  eggGrowthData: DynamicChartPoint[];
  responseData: ResponsePoint[];
  eggDistribution: DistributionItem[];
  locations: DistributionItem[];
  planRevenueData: PlanRevenueItem[];
  ticketLifecycle: TicketLifecycleItem[];
}
