"use client";

import React from 'react';
import { EditPlanWrapper } from './EditPlanWrapper';
import { NewPlanWrapper } from './NewPlanWrapper';

export interface PlanDrawerProps {
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeletePlan: (planId: string, planName: string) => Promise<boolean | void>;
  preloadedCategories?: Array<{ id: string; name: string; planCount: number }>;
}

export function PlanDrawer({
  planId,
  isOpen,
  onClose,
  onSaveSuccess,
  onDeletePlan,
  preloadedCategories,
}: PlanDrawerProps) {
  if (!isOpen) return null;
  return (
    <>
      {planId ? (
        <EditPlanWrapper
          planId={planId}
          onClose={onClose}
          onSaveSuccess={onSaveSuccess}
          onDeletePlan={onDeletePlan}
          preloadedCategories={preloadedCategories}
        />
      ) : (
        <NewPlanWrapper
          onClose={onClose}
          onSaveSuccess={onSaveSuccess}
          preloadedCategories={preloadedCategories}
        />
      )}
    </>
  );
}

export { EditPlanWrapper, NewPlanWrapper };
