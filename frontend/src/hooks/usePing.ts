import { useState, useEffect } from 'react';

import { Location } from '../components/create/types';

export function usePing(locations: Location[]) {
  const [locationsWithPing, setLocationsWithPing] = useState<Location[]>(locations);

  useEffect(() => {
    const updatePing = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/locations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setLocationsWithPing(data);
          }
        }
      } catch (error) {
        console.error('Failed to update pings:', error);
      }
    };

    // Initial ping update
    updatePing();
    
    // Update ping every 10 seconds
    const interval = setInterval(updatePing, 10000);

    return () => clearInterval(interval);
  }, [locations.length]);

  return locationsWithPing;
}
