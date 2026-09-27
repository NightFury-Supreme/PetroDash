/**
 * Error Handling Module Barrel Export
 * Complies with ISO/IEC 25010 (Module Encapsulation & Facade Pattern)
 */

export { ErrorState } from './ErrorState';
export { ErrorHeader } from './ErrorHeader';
export { DashboardButton, GoBackButton } from './ErrorButtons';
export { ErrorDescription } from './ErrorDescription';
export { NotFoundView } from './NotFoundView';
export { ErrorBoundaryView } from './ErrorBoundaryView';
export { GlobalErrorView } from './GlobalErrorView';
export { RootNotFoundView } from './RootNotFoundView';

export type {
  ErrorStateProps,
  DashboardButtonProps,
  GoBackButtonProps,
  ErrorDescriptionProps,
  ErrorBoundaryViewProps,
  GlobalErrorViewProps,
} from './Error.types';
