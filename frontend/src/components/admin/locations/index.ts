/**
 * Admin Locations Module Exports
 */

export { CreateLocationDrawer } from './CreateLocationDrawer';
export { EditLocationDrawer } from './EditLocationDrawer';
export { LocationList } from './LocationList';
export { EditLocationDrawerSkeleton } from './EditLocationDrawerSkeleton';
export { LocationFormBasicSection } from './LocationFormBasicSection';
export { LocationFormPlatformSection } from './LocationFormPlatformSection';
export { LocationFormPermissionsSection } from './LocationFormPermissionsSection';
export { useLocationApi } from '@/hooks/admin/locations';

export type {
  AdminLocation,
  PlatformSettings,
  LocationFormData,
  PlanOption,
  LocationStep,
} from './types';
