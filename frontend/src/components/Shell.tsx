"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { ModalProvider } from "./Modal";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
      setSidebarCollapsed(collapsed);
    };

    // Check initial state
    handleStorageChange();

    // Listen for changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebar-toggle', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-toggle', handleStorageChange);
    };
  }, []);

  return (
    <ModalProvider>
      <div className="flex min-h-screen bg-[#0F0F0F]">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
          {children}
        </main>
      </div>
    </ModalProvider>
  );
}


