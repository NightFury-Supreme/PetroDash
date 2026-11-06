"use client";

import React, { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Ticket } from "lucide-react";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { Drawer } from "@/components/ui/Drawer";
import { useCurrency } from "@/hooks/useCurrency";
import { useTicketMentions } from "@/hooks/tickets";
import { TicketMentionsDropdown } from "./TicketMentionsDropdown";

export interface CreateTicketDrawerProps {
  title: string;
  message: string;
  category: string;
  priority: string;
  categories: string[];
  creating: boolean;
  onTitleChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-5 block">
      <label className="mb-2 block text-sm font-medium text-[#D4D4D4] capitalize">
        {label} <span className="text-[#FF5722]">*</span>
      </label>
      {children}
    </div>
  );
}

export function CreateTicketDrawer({
  title,
  message,
  category,
  priority,
  categories,
  creating,
  onTitleChange,
  onMessageChange,
  onCategoryChange,
  onPriorityChange,
  onClose,
  onCreate,
}: CreateTicketDrawerProps) {
  const t = useTranslations("Tickets");
  const { currency } = useCurrency();
  const editorRef = useRef<HTMLDivElement>(null);

  const {
    mentionsData,
    mentionQuery,
    filteredServers,
    filteredPayments,
    handleInput,
    insertMentionPill,
  } = useTicketMentions(editorRef, onMessageChange);

  useEffect(() => {
    if (message === "" && editorRef.current) {
      if (editorRef.current.innerHTML !== "") editorRef.current.innerHTML = "";
    }
  }, [message]);

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t("createTicket")}
      subtitle={t("createTicket")}
      icon={<Ticket className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg border px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#FF5722] border-[#FF5722] hover:bg-[#F4511E]"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : t("createTicket")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col">
        <Field label={t("subject")}>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t("briefDescription")}
            className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("category")}>
            <SelectDropdown
              value={category}
              onChange={onCategoryChange}
              options={categories.map((c) => ({
                label: c ? c.charAt(0).toUpperCase() + c.slice(1) : '',
                value: c,
              }))}
              className="w-full"
              buttonClassName="h-[42px]"
              placeholder={t("allCategories")}
            />
          </Field>

          <Field label={t("priority")}>
            <SelectDropdown
              value={priority}
              onChange={onPriorityChange}
              options={[
                { label: t("priorities.low"), value: "low" },
                { label: t("priorities.medium"), value: "medium" },
                { label: t("priorities.high"), value: "high" },
              ]}
              className="w-full"
              buttonClassName="h-[42px]"
            />
          </Field>
        </div>

        <Field label={t("message")}>
          <div className="relative">
            <TicketMentionsDropdown
              mentionsData={mentionsData}
              mentionQuery={mentionQuery}
              filteredServers={filteredServers}
              filteredPayments={filteredPayments}
              currency={currency}
              onSelectMention={insertMentionPill}
              className="border-[#2A2A2A] bg-[#161616]"
            />

            <div
              ref={editorRef}
              contentEditable={!creating}
              onInput={handleInput}
              onKeyDown={(e) => {
                if (
                  mentionQuery !== null &&
                  (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter")
                ) {
                  if (e.key === "Enter") e.preventDefault();
                }
              }}
              className={`w-full overflow-y-auto rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm leading-[1.6] text-[#D4D4D4] outline-none min-h-[120px] max-h-[300px] break-words whitespace-pre-wrap transition-colors focus:border-[#FF5722]/60 ${
                creating ? "opacity-50" : ""
              }`}
              style={{ scrollbarWidth: "thin", scrollbarColor: "#555 transparent" }}
              data-placeholder={t("typeMessagePlaceholder")}
            />
            <style
              dangerouslySetInnerHTML={{
                __html: `
              [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #555;
                pointer-events: none;
                display: block;
              }
            `,
              }}
            />
          </div>
        </Field>
      </div>
    </Drawer>
  );
}
