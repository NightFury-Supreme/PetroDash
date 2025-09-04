"use client";
import React from "react";
import { ModalProvider } from "@/components/Modal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      {children}
    </ModalProvider>
  );
}





