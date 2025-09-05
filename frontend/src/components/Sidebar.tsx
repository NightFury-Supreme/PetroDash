"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type NavLink = { href: string; label: string; icon: string };

const baseLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-solid fa-gauge-high" },
  { href: "/panel", label: "Panel", icon: "fa-solid fa-id-card" },
  { href: "/shop", label: "Shop", icon: "fa-solid fa-store" },
  { href: "/referals", label: "Referrals", icon: "fa-solid fa-user-plus" },
  { href: "/profile", label: "Profile", icon: "fa-solid fa-user-cog" },
];

const adminOtherLinks: NavLink[] = [
  { href: "/admin", label: "Admin", icon: "fa-solid fa-gear" },
  { href: "/admin/users", label: "Users", icon: "fa-solid fa-users" },
  { href: "/admin/servers", label: "Servers", icon: "fa-solid fa-server" },
  { href: "/admin/eggs", label: "Eggs", icon: "fa-solid fa-egg" },
  { href: "/admin/locations", label: "Locations", icon: "fa-solid fa-location-dot" },
  { href: "/admin/logs", label: "Logs", icon: "fa-solid fa-list" },
  { href: "/admin/settings", label: "Settings", icon: "fa-solid fa-sliders-h" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ username?: string; email?: string; role?: string; coins?: number; hasActivePlans?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<{ name: string; iconUrl: string }>({ name: 'PteroDash', iconUrl: '' });
  const [openSections, setOpenSections] = useState<{ shop: boolean }>({ shop: false });

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
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => { 
          const d = await r.json(); 
          if (!r.ok) throw new Error(d?.error || 'Failed'); 
          // Check if user has active plans for premium badge
          try {
            const plansResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/user/plans`, { 
              headers: { Authorization: `Bearer ${token}` } 
            });
            if (plansResponse.ok) {
              const plans = await plansResponse.json();
              d.hasActivePlans = plans && plans.length > 0;
            } else {
              d.hasActivePlans = false;
            }
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
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/branding`)
      .then((r) => r.json())
      .then((s) => setBrand({ name: s?.siteName || 'PteroDash', iconUrl: s?.siteIconUrl || '' }))
      .catch(() => setBrand({ name: 'PteroDash', iconUrl: '' }));
  }, []);

  const renderLink = (link: NavLink) => {
    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
    return (
      <Link href={link.href} key={link.href}>
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-[#272727] text-white'
            : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
        }`}>
          <i className={`fas ${link.icon} w-5 text-center ${isActive ? 'text-white' : 'text-[#AAAAAA]'}`}></i>
          {!collapsed && <span className="font-medium">{link.label}</span>}
        </div>
      </Link>
    );
  };

  const isAdmin = user?.role === 'admin';
  const shopLinks: NavLink[] = [
    { href: "/admin/plans", label: "Plans", icon: "fa-solid fa-crown" },
    { href: "/admin/coupons", label: "Coupons", icon: "fa-solid fa-tag" },
    { href: "/admin/shop", label: "Shop", icon: "fa-solid fa-cash-register" },
    { href: "/admin/ledger", label: "Ledger", icon: "fa-solid fa-file-invoice-dollar" },
  ];

  return (
    <aside className={`${collapsed ? "w-20" : "w-72"} bg-[#181818] border-r border-[#303030] transition-all duration-300 ease-in-out fixed left-0 top-0 h-full z-50`}> 
      <div className="h-full flex flex-col">
        {/* Profile / Brand */}
        <div className="p-6 border-b border-[#303030]">
          <div className="flex items-center space-x-4">
            {brand.iconUrl ? (
              <img src={brand.iconUrl} alt="icon" className="w-8 h-8 rounded" />
            ) : (
              <img src="/logo.svg" alt="PteroDash" className="w-8 h-8" />
            )}
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">{brand.name}</h3>
                <button onClick={() => toggleCollapsed(true)} className="p-2.5 hover:bg-[#272727] rounded-lg transition-all duration-200 text-[#AAAAAA] hover:text-white hover:scale-110" aria-label="Collapse">
                  <ChevronLeft size={20} />
                </button>
              </div>
            )}
            {collapsed && (
              <button onClick={() => toggleCollapsed(false)} className="p-2.5 hover:bg-[#272727] rounded-lg transition-all duration-200 text-[#AAAAAA] hover:text-white hover:scale-110" aria-label="Expand">
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Create Server Button */}
        <div className="px-4 mt-4">
          {collapsed ? (
            <Link href="/create">
              <div className="w-full flex items-center justify-center p-3 rounded-lg bg-white hover:bg-gray-100 transition-colors text-black shadow-lg" title="Create a server">
                <i className="fas fa-plus text-lg"></i>
              </div>
            </Link>
          ) : (
            <Link href="/create" className="w-full bg-white hover:bg-gray-100 text-black px-4 py-3 rounded-xl transition-all duration-200 text-center font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105">
              <i className="fas fa-plus text-lg"></i>
              Create a server
            </Link>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            <nav className="space-y-1">
              {baseLinks.map(renderLink)}
            </nav>
            {!collapsed && isAdmin && (
              <div className="mt-2 space-y-1">
                <div className="px-3 text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider">Admin</div>
                <nav className="space-y-1">
                  {adminOtherLinks.map(renderLink)}
                </nav>
                {/* Collapsible Shop Section */}
                <div className="mt-2">
                  <button
                    onClick={() => setOpenSections((s) => ({ ...s, shop: !s.shop }))}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-solid fa-store w-5 text-center" />
                      <span className="font-medium">Shop</span>
                    </div>
                    <i className={`fas fa-chevron-down transition-transform ${openSections.shop ? '' : '-rotate-90'}`} />
                  </button>
                  {openSections.shop && (
                    <div className="pl-6 space-y-1">
                      {shopLinks.map(renderLink)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[#303030]">
          <div className="flex items-center gap-3">
            <i className="fas fa-user text-[#AAAAAA] flex-shrink-0"></i>
            {!collapsed ? (
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-[#303030] rounded w-20"></div>
                    <div className="h-3 bg-[#303030] rounded w-32"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white text-sm">{user?.username || 'User'}</h3>
                      {user?.role && (
                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                          user.role === 'admin'
                            ? 'bg-red-600/20 text-red-300 border-red-700/50'
                            : user?.hasActivePlans
                            ? 'bg-yellow-600/20 text-yellow-300 border-yellow-700/50'
                            : 'bg-green-600/20 text-green-300 border-green-700/50'
                        }`}>
                          {user.role === 'admin' ? 'ADMIN' : user?.hasActivePlans ? 'PREMIUM' : 'USER'}
                        </span>
                      )}
                    </div>
                    {typeof user?.coins === 'number' && (
                      <p className="text-xs text-[#AAAAAA] mb-2"><i className="fas fa-coins mr-1"></i>{user.coins.toLocaleString()} coins</p>
                    )}
                    <button 
                      className="w-full bg-[#303030] hover:bg-[#404040] text-white px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium" 
                      aria-label="Sign out" 
                      onClick={async () => { 
                        try {
                          const token = localStorage.getItem('auth_token');
                          if (token) {
                            await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/logout`, {
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
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>Sign Out
                    </button>
                  </>
                )}
              </div>
            ) : (
              // Collapsed view - show role badge only
              <div className="flex-1 flex justify-center">
                {user?.role && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                    user.role === 'admin' 
                      ? 'bg-red-600/20 text-red-300 border-red-700/50' 
                      : user?.hasActivePlans 
                      ? 'bg-yellow-600/20 text-yellow-300 border-yellow-700/50' 
                      : 'bg-green-600/20 text-green-300 border-green-700/50'
                  }`}>
                    {user.role === 'admin' ? 'A' : user?.hasActivePlans ? 'P' : 'U'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}


