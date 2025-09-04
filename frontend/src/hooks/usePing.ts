import { useState, useEffect } from 'react';
import { measurePingBatch } from '../utils/ping';
import { Location } from '../components/create/types';

export function usePing(locations: Location[]) {
  const [locationsWithPing, setLocationsWithPing] = useState<Location[]>(locations);

  useEffect(() => {
    const updatePing = async () => {
      if (locations.length > 0) {
        const updatedLocations = await measurePingBatch(locations);
        setLocationsWithPing(updatedLocations);
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
