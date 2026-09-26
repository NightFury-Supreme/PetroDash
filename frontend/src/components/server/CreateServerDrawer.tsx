"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Server, Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { CreateServerDrawerSkeleton } from "./CreateServerDrawerSkeleton";
import { useServerCreate, CreateFormData } from "@/hooks/useServerCreate";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";
import {
  CreateServerStepper,
  StepItem,
} from "./steps/CreateServerStepper";
import { CreateServerResourcesStep } from "./steps/CreateServerResourcesStep";
import { CreateServerSoftwareStep } from "./steps/CreateServerSoftwareStep";
import { CreateServerLocationStep } from "./steps/CreateServerLocationStep";
import { CreateServerSummaryStep } from "./steps/CreateServerSummaryStep";

const STEPS: StepItem[] = [
  { id: "resources", label: "Limits" },
  { id: "software", label: "Software" },
  { id: "location", label: "Location" },
  { id: "summary", label: "Summary" },
];

interface CreateServerDrawerProps {
  onClose: () => void;
  onUpdate?: () => void;
}

export function CreateServerDrawer({ onClose, onUpdate }: CreateServerDrawerProps) {
  const { showError, showSuccess } = useToast();
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = STEPS[currentStepIndex].id;

  const {
    loading,
    error,
    eggs,
    locations,
    form,
    setForm,
    violations,
    saving,
    remaining,
    exceeds,
    isFormValid,
    handleSave,
  } = useServerCreate();

  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  const updateValue = useCallback((key: keyof CreateFormData, v: number | string) => {
    setForm((prev) => ({ ...prev, [key]: v }));
  }, [setForm]);

  const groupedEggs = useMemo(() => {
    const groups: Record<string, typeof eggs> = {};
    eggs.forEach((egg) => {
      const cat = egg.categoryName || t("uncategorized");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(egg);
    });
    return groups;
  }, [eggs, t]);

  const isNextDisabled = useMemo(() => {
    if (currentStep === "resources") {
      const missingName = !form.name.trim();
      const anyExceeded = Object.values(exceeds).some(Boolean);
      const resourceViolations = [
        "diskMb",
        "memoryMb",
        "cpuPercent",
        "backups",
        "databases",
        "allocations",
      ].some((k) => (violations as Record<string, string>)[k]);
      return missingName || anyExceeded || resourceViolations;
    }
    if (currentStep === "software") return !form.eggId;
    if (currentStep === "location") return !form.locationId;
    return false;
  }, [currentStep, form.name, form.eggId, form.locationId, exceeds, violations]);

  const handleFinalSubmit = async (e: React.MouseEvent) => {
    const success = await handleSave(e);
    if (success) {
      showSuccess(t("serverCreatedSuccess"));
      if (onUpdate) onUpdate();
      onClose();
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t("createServer")}
      subtitle={t("deployNewServer")}
      icon={<Server className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {currentStepIndex > 0 ? (
            <button
              onClick={() => setCurrentStepIndex((i) => i - 1)}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              {tCommon("back")}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              {tCommon("cancel")}
            </button>
          )}

          {currentStepIndex < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStepIndex((i) => i + 1)}
              disabled={isNextDisabled}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("nextStep")}
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={saving || !isFormValid}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                saving || !isFormValid
                  ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                  : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {t("deploying")}
                </>
              ) : (
                t("createServer")
              )}
            </button>
          )}
        </div>
      }
    >
      {loading ? (
        <CreateServerDrawerSkeleton />
      ) : (
        <div className="flex flex-col min-h-[300px]">
          <CreateServerStepper steps={STEPS} currentIndex={currentStepIndex} />

          <div className="flex-1 pb-8 min-w-0">
            {currentStep === "resources" && (
              <CreateServerResourcesStep
                form={form}
                remaining={remaining as unknown as Record<string, number>}
                violations={violations}
                exceeds={exceeds as unknown as Record<string, boolean>}
                updateValue={updateValue}
              />
            )}

            {currentStep === "software" && (
              <CreateServerSoftwareStep
                groupedEggs={groupedEggs}
                selectedEggId={form.eggId}
                violations={violations}
                onSelectEgg={(eggId) => updateValue("eggId", eggId)}
              />
            )}

            {currentStep === "location" && (
              <CreateServerLocationStep
                locations={locations}
                selectedLocationId={form.locationId}
                violations={violations}
                onSelectLocation={(locId) => updateValue("locationId", locId)}
              />
            )}

            {currentStep === "summary" && (
              <CreateServerSummaryStep form={form} eggs={eggs} locations={locations} />
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
