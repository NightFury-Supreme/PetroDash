"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface AdminLogsErrorProps {
  error: string | null;
}

export function AdminLogsError({ error }: AdminLogsErrorProps) {
    const { showError } = useToast();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!error) return;
    if (last.current === error) return;
    last.current = error;
    (async () => {
      try {
        showError(error);
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {}
    })();
  }, [error]);

  return null;
}



