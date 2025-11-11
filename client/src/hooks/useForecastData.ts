import { useState, useEffect } from 'react';
import { cachedJson } from '../utils/cachedFetch';
import { useApp } from '../contexts/AppContext';

interface Period {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend?: string;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: {
    unitCode: string;
    value: number;
  };
  dewpoint?: {
    unitCode: string;
    value: number;
  };
  relativeHumidity?: {
    unitCode: string;
    value: number;
  };
  cloudCover?: number; // percent (skyCover)
}

interface ForecastData {
  hourly?: Period[];
  daily?: Period[];
}

export const useForecastData = () => {
  const { location } = useApp();
  const [forecastData, setForecastData] = useState<ForecastData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setForecastData({});
      return;
    }

    const fetchForecastData = async () => {
      setLoading(true);
      setError(null);

      const baseUrl = 'http://localhost:8080';

      try {
        // First, get the grid point for the location
        const lat = location.latitude.toFixed(4);
        const lon = location.longitude.toFixed(4);
        const pointUrl = `${baseUrl}/api/points/${lat},${lon}`;
        const pointData = await cachedJson<any>(pointUrl, 30 * 60 * 1000);
        const { gridId, gridX, gridY } = pointData.properties;

        // Fetch hourly, daily, and gridpoint time series (for skyCover)
        const [hourlyJson, dailyJson, gridJson] = await Promise.all([
          cachedJson<any>(`${baseUrl}/api/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`, 30 * 60 * 1000).catch(() => null),
          cachedJson<any>(`${baseUrl}/api/gridpoints/${gridId}/${gridX},${gridY}/forecast`, 30 * 60 * 1000).catch(() => null),
          cachedJson<any>(`${baseUrl}/api/gridpoints/${gridId}/${gridX},${gridY}`, 30 * 60 * 1000).catch(() => null),
        ]);
        let hourlyData = hourlyJson?.properties?.periods || [];
        let dailyData = dailyJson?.properties?.periods || [];

        // Try to enrich hourly data with cloud cover (skyCover from gridpoints)
        if (gridJson && Array.isArray(hourlyData) && hourlyData.length > 0) {
          try {
            const skyCover = gridJson?.properties?.skyCover?.values || [];

            // Minimal ISO8601 duration parser for PT#H / PT#M
            const parseDurationMs = (iso: string): number => {
              const m = iso.match(/^P(?:T(?:(\d+)H)?(?:(\d+)M)?)$/);
              if (!m) return 0;
              const hours = parseInt(m[1] || '0', 10);
              const mins = parseInt(m[2] || '0', 10);
              return (hours * 60 + mins) * 60 * 1000;
            };

            const intervals = skyCover.map((v: { validTime: string; value: number }) => {
              const [startStr, durStr] = v.validTime.split('/');
              const start = new Date(startStr);
              const end = new Date(start.getTime() + parseDurationMs(durStr || 'PT1H'));
              return { start, end, value: typeof v.value === 'number' ? v.value : null };
            });

            hourlyData = hourlyData.map((p: Period) => {
              const st = new Date(p.startTime);
              const match = intervals.find((iv: { start: Date; end: Date; value: number | null }) => iv.value !== null && st >= iv.start && st < iv.end);
              return { ...p, cloudCover: match?.value ?? p.cloudCover };
            });
          } catch (e) {
            // Non-fatal; leave cloudCover undefined
            console.warn('Unable to map skyCover to hourly periods:', e);
          }
        }

        setForecastData({
          hourly: hourlyData,
          daily: dailyData,
        });
      } catch (err) {
        console.error('Error fetching forecast data:', err);
        setError('Failed to load forecast data');
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();

    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetchForecastData();
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [location]);

  return { forecastData, loading, error };
};