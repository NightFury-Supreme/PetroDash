"use client";

import React from "react";
import { Check } from "lucide-react";

export type StepId = 'resources' | 'software' | 'location' | 'summary';

export interface StepItem {
  id: StepId;
  label: string;
}

interface CreateServerStepperProps {
  steps: StepItem[];
  currentIndex: number;
}

export function CreateServerStepper({ steps, currentIndex }: CreateServerStepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${
              idx === currentIndex
                ? 'bg-[#FF5722] text-white'
                : idx < currentIndex
                ? 'bg-[#FF5722]/20 text-[#FF5722]'
                : 'bg-[#161616] text-[#888] border border-[#222]'
            }`}
          >
            {idx < currentIndex ? <Check size={14} /> : (idx + 1)}
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-px mx-4 transition-colors ${
                idx < currentIndex ? 'bg-[#FF5722]/50' : 'bg-[#222]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
