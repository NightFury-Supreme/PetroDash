import { useState, useEffect } from 'react';

interface AuthSettings {
  emailLogin: boolean;
  discord: {
    enabled: boolean;
  };
  google: {
    enabled: boolean;
  };
}

export function useAuthSettings() {
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/`);
        if (!response.ok) {
          throw new Error('Failed to fetch auth settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Default to allowing email login if settings can't be fetched
        setSettings({
          emailLogin: true,
          discord: { enabled: false },
          google: { enabled: false }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
