"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "@/i18n/routing";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import Topbar from "./Topbar";
import { HeaderAd, FooterAd, MobileAd, AdBlockerScreen, hasAdBlocker, clearAdBlockerCache, getCachedAdBlockerResult } from "@/components/ads";
import { useAppConfig } from "@/hooks/useAppConfig";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { config } = useAppConfig();
  const settings = config.ads;
  const [showBlockerScreen, setShowBlockerScreen] = useState<boolean>(() => {
    return Boolean(settings?.enabled && getCachedAdBlockerResult() === true);
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem("sidebar_collapsed") === "true";
      document.documentElement.style.setProperty("--sidebar-width", collapsed ? "5rem" : "16rem");
    };

    handleStorageChange();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sidebar-toggle", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sidebar-toggle", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let active = true;

    hasAdBlocker().then((blocked) => {
      if (!active) return;
      if (blocked && settings?.enabled) {
        setShowBlockerScreen(true);
      } else if (!blocked) {
        setShowBlockerScreen(false);
      }
    });

    const handleDetected = () => {
      if (settings && !settings.enabled) return;
      setShowBlockerScreen(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearAdBlockerCache();
        hasAdBlocker().then((blocked) => {
          if (!active) return;
          if (blocked && settings?.enabled) {
            setShowBlockerScreen(true);
          } else if (!blocked) {
            setShowBlockerScreen(false);
          }
        });
      }
    };

    window.addEventListener("adblocker:detected", handleDetected);
    window.addEventListener("adblocker:open", handleDetected);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("adblocker:detected", handleDetected);
      window.removeEventListener("adblocker:open", handleDetected);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [settings?.enabled]);

  if (showBlockerScreen && Boolean(settings?.enabled)) {
    return <AdBlockerScreen />;
  }

  const isTicketChat = (pathname.startsWith("/tickets/") && pathname !== "/tickets") || Boolean(pathname.match(/^\/admin\/tickets\/.+/));

  return (
    <div className="flex min-h-screen bg-[#0F0F0F]">
      <Sidebar />
      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{
          marginLeft: "var(--sidebar-width, 16rem)",
        }}
      >
        <main className="flex-1 flex flex-col">
          <Topbar />
          <HeaderAd />
          <MobileAd />
          {children}
        </main>
        {!isTicketChat && (
          <>
            <FooterAd />
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}
