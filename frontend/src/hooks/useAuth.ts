import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        setToken(authToken);
      } catch (error) {
        console.error('Error getting auth token:', error);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, []);

  return { token, loading };
}
