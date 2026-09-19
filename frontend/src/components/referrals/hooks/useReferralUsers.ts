/* ==========================================================================
   useReferralUsers — Custom hook for paginated referred users list
   Isolation: pagination state owned here, page prop changes trigger refetch
   OWASP: token validated, no sensitive data exposed in errors
========================================================================== */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { ReferralUser } from "../types";

const USERS_PER_PAGE = 5;

interface UseReferralUsersResult {
  users: ReferralUser[];
  loading: boolean;
  page: number;
  totalUsers: number;
  totalPages: number;
  pageSize: number;
  setPage: (page: number) => void;
}

export function useReferralUsers(): UseReferralUsersResult {
  const t = useTranslations("Referrals");
  const { showError } = useToast();
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) return;

      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/referrals/list?page=${page}&limit=${USERS_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error(t("failedToLoadUsers"));

      const data = await res.json();
      setUsers(data.users ?? []);
      setTotalUsers(data.total ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("unexpectedError");
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [page, t, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));

  return { users, loading, page, totalUsers, totalPages, pageSize: USERS_PER_PAGE, setPage };
}
