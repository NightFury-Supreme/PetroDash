import { useState, useEffect } from 'react';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useTranslations } from 'next-intl';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  releaseNotes: string;
  publishedAt: string;
  releaseUrl: string;
  fullDownloadUrl?: string;
  fullPackageSize?: number;
  fullPackageName?: string;
}

export interface UpdateStatus {
  status: 'idle' | 'starting' | 'backing_up' | 'downloading' | 'extracting' | 'applying' | 'installing_deps' | 'building' | 'completed' | 'failed';
  message: string;
  progress: number;
  timestamp: string;
  newVersion?: string;
  error?: string;
}

export function useUpdateSystem() {
  const t = useTranslations('AdminUpdates');
  const tErrorBackend = useTranslations('BackendErrors');

  const [token, setToken] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, _setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, _setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getToken = () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        setToken(authToken);
      } catch (error) {
        console.error('Error getting auth token:', error);
        setToken(null);
      }
    };
    getToken();
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/updates/check`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errData: any = {};
        try { errData = await response.json(); } catch {}
        const errKey = errData.error || errData.code || 'Failed to check for updates';
        throw new Error(errKey);
      }

      let data: any = {}; try { data = await response.json(); } catch {}
      setUpdateInfo(data);
    } catch (err) {
      const errKey = err instanceof Error ? err.message : 'Failed to check for updates';
      setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (errKey !== 'Failed to check for updates' ? errKey : t('failedToCheckUpdates')));
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (token) {
      checkForUpdates();
    }
  }, [token]);

  return {
    updateInfo,
    updateStatus,
    isChecking,
    isUpdating,
    error,
    checkForUpdates
  };
}
