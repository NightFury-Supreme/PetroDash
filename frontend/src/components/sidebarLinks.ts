import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Store,
  Coins,
  Gift,
  Users,
  Key,
  Ticket,
  Settings,
  Headphones,
  Shield,
  Server,
  Package,
  MapPin,
  List,
  Sliders,
} from "lucide-react";

export type NavLink = { href: string; labelKey: string; icon: LucideIcon };

export const baseLinks: NavLink[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/shop", labelKey: "store", icon: Store },
  { href: "/earn", labelKey: "earn", icon: Coins },
  { href: "/gift", labelKey: "gift", icon: Gift },
  { href: "/referrals", labelKey: "affiliates", icon: Users },
];

export const supportLinks: NavLink[] = [
  { href: "/panel", labelKey: "panelCredentials", icon: Key },
  { href: "/tickets", labelKey: "helpSupport", icon: Headphones },
  { href: "/profile", labelKey: "settings", icon: Settings },
];

export const adminOtherLinks: NavLink[] = [
  { href: "/admin", labelKey: "admin", icon: Shield },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/servers", labelKey: "servers", icon: Server },
  { href: "/admin/eggs", labelKey: "eggs", icon: Package },
  { href: "/admin/locations", labelKey: "locations", icon: MapPin },
  { href: "/admin/earn", labelKey: "adminEarn", icon: Coins },
  { href: "/admin/gift", labelKey: "gifts", icon: Gift },
  { href: "/admin/tickets", labelKey: "tickets", icon: Ticket },
  { href: "/admin/logs", labelKey: "logs", icon: List },
  { href: "/admin/settings", labelKey: "adminSettings", icon: Sliders },
];
