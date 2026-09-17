"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { Link } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
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
  PanelLeft,
  LogOut
} from "lucide-react";

type NavLink = { href: string; label: string; icon: LucideIcon };

const baseLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shop", label: "Store", icon: Store },
  { href: "/earn", label: "AFK Earn", icon: Coins },
  { href: "/gift", label: "Redeem Gift", icon: Gift },
  { href: "/referrals", label: "Affiliates", icon: Users },
];

const supportLinks: NavLink[] = [
  { href: "/panel", label: "Panel Credentials", icon: Key },
  { href: "/tickets", label: "Help & Support", icon: Headphones },
  { href: "/profile", label: "Settings", icon: Settings },
];

const adminOtherLinks: NavLink[] = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/servers", label: "Servers", icon: Server },
  { href: "/admin/eggs", label: "Eggs", icon: Package },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/earn", label: "Earn", icon: Coins },
  { href: "/admin/gift", label: "Gifts", icon: Gift },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/logs", label: "Logs", icon: List },
  { href: "/admin/settings", label: "Settings", icon: Sliders },
];


function NavButton({
  item,
  collapsed,
  isActive,
}: {
  item: NavLink;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="block">
      <div
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }`}
      >
        <Icon size={17} strokeWidth={1.75} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ username?: string; email?: string; role?: string; coins?: number; hasActivePlans?: boolean; profilePicture?: string; firstName?: string; lastName?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<{ name: string; icon: string; earnEnabled: boolean }>({ name: 'PetroDash', icon: '', earnEnabled: false });

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    setCollapsed(savedCollapsed);
  }, []);

  // Save collapsed state to localStorage and dispatch event
  const toggleCollapsed = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebar_collapsed', newCollapsed.toString());
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => { 
          let d: any = {}; try { d = await r.json(); } catch {} 
          if (!r.ok) throw new Error(d?.error || 'Failed'); 
          // Check if user has active plans for premium badge
          try {
            const plansResponse = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/user/plans`, { 
              headers: { Authorization: `Bearer ${token}` } 
            });
            if (plansResponse.ok) {
              let plans: any = {}; try { plans = await plansResponse.json(); } catch {}
              d.hasActivePlans = plans && plans.length > 0;
            } else {
              d.hasActivePlans = false;
            }
          // eslint-disable-next-line unused-imports/no-unused-vars
          } catch (_) {
            d.hasActivePlans = false;
          }
          setUser(d); 
          setLoading(false); 
        })
        .catch(() => { setUser(null); setLoading(false); });
    } else {
      setLoading(false);
    }
    // Also load brand settings for icon and name
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/branding`)
      .then((r) => r.json())
      .then((s) => setBrand({ name: s?.siteName || 'PetroDash', icon: s?.siteIcon || '', earnEnabled: !!s?.earnEnabled }))
      .catch(() => setBrand({ name: 'PetroDash', icon: '', earnEnabled: false }));
  }, []);

  const isAdmin = user?.role === 'admin';

  const checkIsActive = (href: string) => {
    // Special case for Admin root
    if (href === '/admin' && pathname === '/admin') return true;
    if (href === '/admin' && pathname !== '/admin') return false;
    
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full shrink-0 flex-col bg-[#0F0F0F] transition-all duration-200 ease-out border-r border-white/5 z-50 flex ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-7">
        <div className="flex min-w-0 items-center gap-3">
          <img 
            src={brand.icon || "/logo.svg"} 
            alt={brand.name} 
            className="w-7 h-7 rounded-md object-contain shrink-0" 
          />
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight text-white">
              {brand.name}
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={() => toggleCollapsed(true)}
            aria-label="Collapse sidebar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            <PanelLeft size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={() => toggleCollapsed(false)}
          aria-label="Expand sidebar"
          className="mx-auto -mt-4 mb-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          <PanelLeft size={16} strokeWidth={1.75} />
        </button>
      )}

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 flex flex-col gap-6">
        
        {/* Main Navigation */}
        <div>
          {!collapsed && (
            <p className="mb-2 px-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
              Main Navigation
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {baseLinks
              .filter(item => item.href !== "/earn" || brand.earnEnabled)
              .map((item) => (
              <NavButton
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={checkIsActive(item.href)}
              />
            ))}
          </nav>
        </div>

        {/* Admin Navigation */}
        {!collapsed && isAdmin && (
          <div>
            <p className="mb-2 px-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
              Admin
            </p>
            <nav className="flex flex-col gap-0.5">
              {adminOtherLinks.map((item) => (
                <NavButton
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isActive={checkIsActive(item.href)}
                />
              ))}
              
              {/* Store Section */}
              <NavButton
                item={{ href: "/admin/store", label: "Store", icon: Store }}
                collapsed={collapsed}
                isActive={checkIsActive("/admin/store")}
              />
            </nav>
          </div>
        )}
      </div>

      {/* Support (Fixed at Bottom) */}
      <div className="px-3 pt-4 border-t border-white/5">
        {!collapsed && (
          <p className="mb-2 px-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
            Support
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {supportLinks.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={checkIsActive(item.href)}
            />
          ))}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="p-3">
        <div
          className={`flex w-full items-center gap-2.5 rounded-xl border border-[#222] bg-[#161616] p-2 text-left transition-colors hover:bg-[#1a1a1a] ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.username || 'User'} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-700 text-xs font-semibold text-white">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex flex-col justify-center">
                {loading ? (
                  <div className="space-y-1.5">
                    <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse"></div>
                    <div className="h-2 bg-zinc-900 rounded w-16 animate-pulse"></div>
                  </div>
                ) : (
                  <>
                    <span className="truncate text-[13px] font-medium text-zinc-100 leading-tight">
                      {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 pr-2">
                      <div className="flex items-center gap-1 text-[11px] font-medium leading-tight text-zinc-300">
                        <Coins size={10} strokeWidth={2} />
                        <span>{user?.coins ?? 0} coins</span>
                      </div>
                      {user?.role && (
                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider leading-none shrink-0 ${
                          user.role === 'admin' 
                            ? 'bg-orange-950/50 text-orange-500 border border-orange-500/20'
                            : 'bg-white/5 text-zinc-400 border border-white/10'
                        }`}>
                          {user.role}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {!collapsed && (
            <button 
              className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors rounded-md hover:bg-white/5 shrink-0"
              onClick={async (e) => { 
                e.stopPropagation();
                try {
                  const token = localStorage.getItem('auth_token');
                  if (token) {
                    await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/logout`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                  }
                } catch (error) {
                  console.error('Logout error:', error);
                } finally {
                  localStorage.removeItem('auth_token');
                  router.push('/login');
                }
              }}
              title="Sign Out"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
