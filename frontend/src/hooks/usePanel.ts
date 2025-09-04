import { useState, useEffect, useCallback } from 'react';

interface PanelInfo {
  email: string;
  username: string;
  panelUrl: string;
  loginUrl: string;
}

interface UsePanelReturn {
  // State
  loading: boolean;
  error: string | null;
  info: PanelInfo | null;
  resetting: boolean;
  newPassword: string | null;
  
  // Actions
  resetPassword: () => Promise<void>;
  clearError: () => void;
  clearNewPassword: () => void;
}

export function usePanel(): UsePanelReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PanelInfo | null>(null);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  // Load panel info
  const loadPanelInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/panel`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to load panel information');
      }

      const data = await response.json();
      setInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load panel information');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async () => {
    try {
      setError(null);
      setNewPassword(null);
      setResetting(true);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/panel/reset-password`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to reset password');
      }

      const data = await response.json();
      setNewPassword(data.password);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear new password
  const clearNewPassword = useCallback(() => {
    setNewPassword(null);
  }, []);

  // Load panel info on mount
  useEffect(() => {
    loadPanelInfo();
  }, [loadPanelInfo]);

  return {
    // State
    loading,
    error,
    info,
    resetting,
    newPassword,
    
    // Actions
    resetPassword,
    clearError,
    clearNewPassword,
  };
}
