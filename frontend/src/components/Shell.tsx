"use client";

import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import { ModalProvider } from "./Modal";

export default function Shell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
      
      // Update CSS custom property on the document root
      document.documentElement.style.setProperty('--sidebar-width', collapsed ? '5rem' : '18rem');
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
        <main 
          className="flex-1 transition-all duration-300 ease-in-out"
          style={{
            marginLeft: 'var(--sidebar-width, 18rem)'
          }}
        >
          {children}
        </main>
      </div>
    </ModalProvider>
  );
}


