import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ErrorState, DashboardButton, GoBackButton } from "@/components/ui/ErrorState";

export function AdminTicketErrorView({ error }: { error: string | null }) {
  const t = useTranslations("AdminTickets");
  const tCommon = useTranslations("Common");
  const tErrorBackend = useTranslations("BackendErrors");
  const tErrorState = useTranslations("ErrorState");

  const isForbidden = error === "ERR_TICKET_FORBIDDEN";

  return (
    <ErrorState
      fullScreen={false}
      header={<React.Fragment />}
      showFooter={false}
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]"
          aria-hidden="true"
        >
          <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
          <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
          <path d="M6 6h.01" />
          <path d="M6 18h.01" />
          <path d="m13 6-4 6h6l-4 6" />
        </svg>
      }
      title={
        isForbidden
          ? (tErrorBackend.has("ERR_TICKET_FORBIDDEN") ? tErrorBackend("ERR_TICKET_FORBIDDEN") : tCommon("forbidden"))
          : tErrorState("pageNotFound")
      }
      description={
        <p>
          {isForbidden
            ? (tErrorBackend.has("ERR_TICKET_FORBIDDEN") ? tErrorBackend("ERR_TICKET_FORBIDDEN") : tCommon("forbidden"))
            : tErrorState("descNotFound", { topic: tCommon("ticket").toLowerCase() })}
        </p>
      }
      buttons={
        <>
          <DashboardButton />
          <Link
            href="/admin/tickets"
            className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-[#D4D4D4] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
          >
            {t("backToTickets")}
          </Link>
          <GoBackButton />
        </>
      }
    />
  );
}
