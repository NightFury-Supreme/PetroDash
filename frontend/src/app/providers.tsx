"use client";
import React from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { TopProgressBar } from "@/components/ui";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <TopProgressBar />
      {children}
    </ToastProvider>
  );
}
