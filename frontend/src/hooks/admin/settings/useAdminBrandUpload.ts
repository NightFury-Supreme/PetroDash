import { useState, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useAdminBrandUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadIcon = useCallback(async (file: File): Promise<string> => {
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const fd = new FormData();
      fd.append('icon', file);

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        throw new Error('ERR_ICON_UPLOAD_FAILED');
      }

      const data = await res.json();
      return data.filePath || data.url || '';
    } catch (err: any) {
      setError(err?.message || 'ERR_ICON_UPLOAD_FAILED');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    error,
    uploadIcon,
  };
}
