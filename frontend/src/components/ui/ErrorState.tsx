/**
 * ErrorState Facade Re-export
 * Maintained for backwards compatibility across existing UI consumers.
 * Canonical implementations reside in '@/components/error' module.
 */

export {
  ErrorState,
  DashboardButton,
  GoBackButton,
  ErrorDescription,
} from '@/components/error';

export type {
  ErrorStateProps,
  DashboardButtonProps,
  GoBackButtonProps,
  ErrorDescriptionProps,
} from '@/components/error';
