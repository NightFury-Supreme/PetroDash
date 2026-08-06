"use client";

import { useState, useEffect } from "react";

/**
 * Returns the correct left-padding value for page content
 * based on the sidebar's collapsed/expanded state.
 * Listens to the 'sidebar-toggle' custom event to react to changes.
 */
export function useSidebarPadding(): number {
  const [padding, setPadding] = useState<number>(288);

  useEffect(() => {
    const read = () => {
      try {
        setPadding(localStorage.getItem("sidebar_collapsed") === "true" ? 80 : 288);
      } catch {
        setPadding(288);
      }
    };
    read();
    window.addEventListener("sidebar-toggle", read);
    return () => window.removeEventListener("sidebar-toggle", read);
  }, []);

  return padding;
}
