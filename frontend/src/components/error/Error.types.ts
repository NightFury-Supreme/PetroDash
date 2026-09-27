/**
 * Error Handling Types & Interfaces
 * Complies with ISO/IEC 25010 (Maintainability) and WCAG 2.1 (Accessibility)
 */

import { type ReactNode } from 'react';

export interface ErrorStateProps {
  icon: ReactNode;
  kicker: string;
  title: string;
  description: ReactNode;
  buttons?: ReactNode;
  fullScreen?: boolean;
  errorString?: string | null;
  header?: ReactNode;
}

export interface DashboardButtonProps {
  variant?: 'primary' | 'secondary';
  label?: string;
  className?: string;
}

export interface GoBackButtonProps {
  variant?: 'primary' | 'secondary';
  label?: string;
  className?: string;
}

export interface ErrorDescriptionProps {
  error: string;
  topic?: string;
}

export interface ErrorBoundaryViewProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export interface GlobalErrorViewProps {
  error: Error & { digest?: string };
  reset?: () => void;
}
