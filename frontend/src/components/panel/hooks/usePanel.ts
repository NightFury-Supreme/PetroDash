import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useCallback } from 'react';

interface PanelData {
  email: string;
  panelUrl: string;
}

interface UsePanelReturn {
  panelData: PanelData | null;
  password: string;
  loading: boolean;
  error: string | null;
  resetting: boolean;
  fetchPanelData: () => Promise<void>;
  resetPassword: () => Promise<string | void>;
}

export function usePanel(): UsePanelReturn {
  const tError = useTranslations('GlobalErrors');
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const [password, setPassword] = useState("                ");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchPanelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/panel`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorData: any = {}; try { errorData = await response.json(); } catch {}
        const code = errorData?.error?.code;
        const msg = errorData?.error?.message || errorData?.error;
        throw new Error(code || msg || tError('failedToLoadPanelInformation'));
      }

      const data = await response.json();
      setPanelData(data);
    } catch (err: any) {
      setError(err.message || tError('failedToLoadPanelInformation'));
    } finally {
      setLoading(false);
    }
  }, [tError]);

  const resetPassword = useCallback(async () => {
    if (resetting) return;
    try {
      setResetting(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error(tError('authenticationRequired'));
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/panel/reset`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorData: any = {}; try { errorData = await response.json(); } catch {}
        const code = errorData?.error?.code;
        const msg = errorData?.error?.message || errorData?.error;
        throw new Error(code || msg || tError('failedToResetPassword'));
      }

      const data = await response.json();
      setPassword(data.password);
      return data.password;
    } finally {
      setResetting(false);
    }
  }, [resetting, tError]);

  useEffect(() => {
    fetchPanelData();
  }, [fetchPanelData]);

  return {
    panelData,
    password,
    loading,
    error,
    resetting,
    fetchPanelData,
    resetPassword,
  };
}
