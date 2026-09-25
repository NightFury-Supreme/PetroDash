/* ==========================================================================
   Admin Locations Module Barrel Export
   Compliance: ISO/IEC 25010, Clean Architecture
========================================================================== */

export { CreateLocationDrawer } from './CreateLocationDrawer';
export { EditLocationDrawer } from './EditLocationDrawer';
export { LocationList } from './LocationList';
export { EditLocationDrawerSkeleton } from './EditLocationDrawerSkeleton';
export { LocationFormBasicSection } from './LocationFormBasicSection';
export { LocationFormPlatformSection } from './LocationFormPlatformSection';
export { LocationFormPermissionsSection } from './LocationFormPermissionsSection';
export { useLocationApi } from './hooks/useLocationApi';

export type {
  AdminLocation,
  PlatformSettings,
  LocationFormData,
  PlanOption,
  LocationStep,
} from './types';
