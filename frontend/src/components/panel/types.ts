import type { ReactNode } from "react";

export interface CredentialRowProps {
  icon: ReactNode;
  label: string;
  description: string;
  value: string;
  action: ReactNode;
  mono?: boolean;
}

export interface ResetPasswordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading: boolean;
  username?: string;
  email?: string;
}
