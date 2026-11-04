"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  PanelLeft,
  LogOut,
  Store,
  Coins,
} from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { NavButton } from "./NavButton";
import { baseLinks, supportLinks, adminOtherLinks } from "./sidebarLinks";
import { RankBadge, UserAvatar } from "@/components/ui";
import { SidebarAd } from "@/components/ads";


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("Nav");
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, brand, logout } = useSidebarUser();

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar_collapsed") === "true";
    setCollapsed(savedCollapsed);
  }, []);

  const toggleCollapsed = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    localStorage.setItem("sidebar_collapsed", newCollapsed.toString());
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  const isAdmin = user?.role === "admin";

  const checkIsActive = (href: string) => {
    if (href === "/admin" && pathname === "/admin") return true;
    if (href === "/admin" && pathname !== "/admin") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 h-screen max-h-screen shrink-0 flex-col bg-[#0F0F0F] transition-all duration-200 ease-out border-r border-white/5 z-50 flex ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 pt-5 pb-7">
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
            aria-label={tNav('collapseSidebar')}
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
          aria-label={tNav('expandSidebar')}
          className="mx-auto -mt-4 mb-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          <PanelLeft size={16} strokeWidth={1.75} />
        </button>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 flex flex-col gap-6">
        <div>
          {!collapsed && (
            <p className="mb-2 px-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
              {tNav("mainNav")}
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {baseLinks
              .filter((item) => item.href !== "/earn" || brand.earnEnabled)
              .map((item) => (
                <NavButton
                  key={item.href}
                  item={item}
                  label={tNav(item.labelKey)}
                  collapsed={collapsed}
                  isActive={checkIsActive(item.href)}
                />
              ))}
          </nav>
        </div>

        {!collapsed && !isAdmin && <SidebarAd />}

        {!collapsed && isAdmin && (
          <div>
            <p className="mb-2 px-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
              {tNav("admin")}
            </p>
            <nav className="flex flex-col gap-0.5">
              {adminOtherLinks.map((item) => (
                <NavButton
                  key={item.href}
                  item={item}
                  label={tNav(item.labelKey)}
                  collapsed={collapsed}
                  isActive={checkIsActive(item.href)}
                />
              ))}
              <NavButton
                item={{ href: "/admin/store", labelKey: "adminStore", icon: Store }}
                label={tNav("adminStore")}
                collapsed={collapsed}
                isActive={checkIsActive("/admin/store")}
              />
            </nav>
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pt-4 border-t border-white/5">
        {!collapsed && (
          <p className="mb-2 px-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
            {tNav("support")}
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {supportLinks.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              label={tNav(item.labelKey)}
              collapsed={collapsed}
              isActive={checkIsActive(item.href)}
            />
          ))}
        </nav>
      </div>

      <div className="shrink-0 p-3">
        <div
          onClick={() => router.push('/profile')}
          className={`flex w-full items-center gap-2.5 rounded-xl border border-[#222] bg-[#161616] p-2 text-left transition-colors hover:bg-[#1a1a1a] cursor-pointer ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar
              src={user?.profilePicture}
              username={user?.username}
              email={user?.email}
              size={34}
              rounded="full"
              className="w-[34px] h-[34px] border-none ring-0 outline-none shrink-0"
            />
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
                      {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User")}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px] font-normal leading-tight text-zinc-300 whitespace-nowrap shrink-0">
                        <Coins size={11} strokeWidth={1.5} className="shrink-0 text-white" />
                        <span className="whitespace-nowrap">{tNav("coins", { count: user?.coins ?? 0 })}</span>
                      </div>
                      {user?.role && (
                        <RankBadge rank={user.role} size="sm" className="shrink-0" />
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
              onClick={handleLogout}
              title={tNav("signOut")}
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
