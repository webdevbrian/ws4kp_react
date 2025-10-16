import { useState, useEffect } from 'react';

export interface TravelCity {
  Name: string;
  Latitude: number;
  Longitude: number;
  point: {
    x: number;
    y: number;
    wfo: string;
  };
}

export const useTravelCities = () => {
  const [cities, setCities] = useState<TravelCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        setError(null);

        const tryUrls = [
          '/data/travelcities.json',
          'http://localhost:8080/data/travelcities.json',
          '/datagenerators/output/travelcities.json',
        ];

        let loaded: TravelCity[] | null = null;
        let lastErr: any = null;
        for (const url of tryUrls) {
          try {
            const res = await fetch(url);
            if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
            const j = await res.json();
            loaded = j;
            break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (!loaded) {
          throw lastErr || new Error('Failed to fetch travel cities');
        }

        setCities(loaded);
      } catch (err) {
        console.error('Error fetching travel cities:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch travel cities');
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return { cities, loading, error };
};