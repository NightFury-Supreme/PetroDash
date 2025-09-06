import { useState, useEffect } from 'react';

interface AdSenseSettings {
  enabled: boolean;
  publisherId: string;
  adSlots: {
    header: string;
    sidebar: string;
    footer: string;
    content: string;
    mobile: string;
  };
  adTypes: {
    display: boolean;
    text: boolean;
    link: boolean;
    inFeed: boolean;
    inArticle: boolean;
    matchedContent: boolean;
  };
  adPositions: {
    showOnDashboard: boolean;
    showOnShop: boolean;
    showOnPanel: boolean;
    showOnAuth: boolean;
  };
}

export function useAdSenseSettings() {
  const [settings, setSettings] = useState<AdSenseSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Use public settings endpoint (we'll need to create this)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/settings/adsense`);

        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load AdSense settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
}
