"use client";

import { usePathname } from "@/i18n/routing";
import Shell from "@/components/Shell";

interface LayoutWithAdsProps {
  children: React.ReactNode;
}

const SHELL_PAGES = [
  "/dashboard",
  "/panel",
  "/shop",
  "/gift",
  "/create",
  "/admin",
  "/server",
  "/referrals",
  "/tickets",
  "/profile",
  "/earn",
];

const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot",
  "/verify",
  "/2fa",
  "/auth",
  "/join",
  "/banned",
];

export default function LayoutWithAds({ children }: LayoutWithAdsProps) {
  const pathname = usePathname() || "";

  if (AUTH_PAGES.some((page) => pathname.startsWith(page))) {
    return <>{children}</>;
  }

  const usesShell = SHELL_PAGES.some((page) => pathname.startsWith(page));

  if (usesShell) {
    return <Shell>{children}</Shell>;
  }

  return <>{children}</>;
}
