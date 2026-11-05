export interface PanelData {
  email: string;
  username: string;
  panelUrl: string;
  loginUrl: string;
}

export interface UsePanelReturn {
  panelData: PanelData | null;
  password: string | null;
  loading: boolean;
  error: string | null;
  resetting: boolean;
  fetchPanelData: (options?: { force?: boolean }) => Promise<void>;
  resetPassword: () => Promise<string | void>;
}

export interface ApiErrorResponse {
  error?: string | { code?: string; message?: string };
  code?: string;
  message?: string;
}
