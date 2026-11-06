import { useState, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { updateCachedUser } from '@/utils/userCache';

export function useProfilePicture() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPicture = useCallback(async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('avatar', file);

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me/picture/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` },
        body: formData,
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(d?.error || d?.message || 'ERR_UPLOAD_FAILED');
      }

      const updatedPicture = d.profilePicture || '';
      updateCachedUser({ profilePicture: updatedPicture });
      window.dispatchEvent(new CustomEvent('user:refresh'));
      return updatedPicture;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ERR_UPLOAD_FAILED';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const syncOAuthPicture = useCallback(async (provider?: 'discord' | 'google'): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me/picture/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ provider }),
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(d?.error || d?.message || 'ERR_OAUTH_SYNC_FAILED');
      }

      const updatedPicture = d.profilePicture || '';
      updateCachedUser({ profilePicture: updatedPicture });
      window.dispatchEvent(new CustomEvent('user:refresh'));
      return updatedPicture;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ERR_OAUTH_SYNC_FAILED';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPicture = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me/picture`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` },
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(d?.error || d?.message || 'ERR_RESET_FAILED');
      }

      const updatedPicture = d.profilePicture || '';
      updateCachedUser({ profilePicture: updatedPicture });
      window.dispatchEvent(new CustomEvent('user:refresh'));
      return updatedPicture;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ERR_RESET_FAILED';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    uploadPicture,
    syncOAuthPicture,
    resetPicture,
  };
}
