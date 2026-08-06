"use client";

import { useEffect, useRef } from "react";
import { useModal } from "@/components/Modal";

interface AdminLedgerErrorProps {
  error: string | null;
}

export function AdminLedgerError({ error }: AdminLedgerErrorProps) {
  const modal = useModal();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!error) return;
    if (last.current === error) return;
    last.current = error;
    (async () => {
      try {
        await modal.error({ title: "Error", body: error });
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {}
    })();
  }, [error, modal]);

  return null;
}

