"use client";

import React, { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Server, FileText, Ticket } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { useCurrency } from "@/hooks/useCurrency";
import { useTicketMentions } from "@/hooks/tickets";

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
  const tCommon = useTranslations("Common");
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

  // Sync external clear
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
            onClick={onClose}
            disabled={creating}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
          >
            {tCommon("cancel")}
          </button>
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
            <Select
              value={category}
              onChange={onCategoryChange}
              options={categories.map((c) => ({ label: c, value: c }))}
            />
          </Field>

          <Field label={t("priority")}>
            <Select
              value={priority}
              onChange={onPriorityChange}
              options={[
                { label: t("priorities.low"), value: "low" },
                { label: t("priorities.normal"), value: "normal" },
                { label: t("priorities.high"), value: "high" },
              ]}
            />
          </Field>
        </div>

        <Field label={t("message")}>
          <div className="relative">
            {mentionQuery !== null && (
              <div className="absolute bottom-full mb-2 left-0 w-80 max-h-64 overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#161616] p-2 shadow-2xl z-50">
                {!mentionsData ? (
                  <div className="p-3 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> {tCommon("loading")}
                  </div>
                ) : filteredServers.length === 0 && filteredPayments.length === 0 ? (
                  <div className="p-3 text-center text-xs text-white/40">{t("noMatches")}</div>
                ) : (
                  <>
                    {filteredServers.length > 0 && (
                      <div className="mb-2">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
                          {t("servers")}
                        </div>
                        {filteredServers.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => insertMentionPill("server", s.id, s.name)}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                          >
                            <Server size={14} className="text-[#FF5722]" />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-white/80">{s.name}</span>
                              <span className="text-[10px] text-white/40 font-mono">
                                {s.identifier || s.id}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {filteredPayments.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
                          {t("invoices")}
                        </div>
                        {filteredPayments.map((p) => (
                          <button
                            key={p._id}
                            onClick={() =>
                              insertMentionPill("invoice", p._id, `${t("invoiceLabel")}${p._id.slice(-6).toUpperCase()}`)
                            }
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                          >
                            <FileText size={14} className="text-emerald-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-white/80">
                                {t("invoiceLabel")}{p._id.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-white/40">
                                {p.amount} {currency}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

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
