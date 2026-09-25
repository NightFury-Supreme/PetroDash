/* ==========================================================================
   Admin Eggs Shared Types & Interfaces
   Compliance: ISO/IEC 25010, Strict Type Safety
========================================================================== */

export interface EnvVar {
  key: string;
  value: string;
}

export interface AdminEgg {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  categoryName?: string;
  pterodactylEggId: number | string;
  pterodactylNestId: number | string;
  recommended: boolean;
  allowedPlans: string[];
  allowedPlanNames?: string[];
  serversCount?: number;
  env?: EnvVar[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EggCategory {
  id: string;
  name: string;
  eggCount: number;
}

export interface PlanOption {
  _id?: string;
  id?: string;
  name: string;
  pricePerMonth?: number;
  currency?: string;
}

export interface EggFormState {
  name: string;
  category: string;
  description: string;
  icon: string;
  pterodactylEggId: string;
  pterodactylNestId: string;
  recommended: boolean;
  allowedPlans: string[];
}

export type WizardStepId = 'basic' | 'panel' | 'permissions';
