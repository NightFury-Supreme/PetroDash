'use client';

import { useState, useEffect } from 'react';
import {
  fetchAppConfig,
  getCachedAppConfigSync,
  isConfigLoaded,
  subscribeAppConfig,
  type AppConfig,
} from '@/utils/configCache';

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(getCachedAppConfigSync);
  const [loading, setLoading] = useState<boolean>(() => !isConfigLoaded());

  useEffect(() => {
    const unsubscribe = subscribeAppConfig((next) => {
      setConfig(next);
      setLoading(false);
    });

    fetchAppConfig().then((next) => {
      setConfig(next);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { config, loading };
}

