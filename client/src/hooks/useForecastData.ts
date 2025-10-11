import { useState, useEffect } from 'react';
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

        const pointResponse = await fetch(pointUrl);
        if (!pointResponse.ok) {
          throw new Error('Failed to fetch location data');
        }

        const pointData = await pointResponse.json();
        const { gridId, gridX, gridY } = pointData.properties;

        // Fetch both hourly and daily forecasts
        const [hourlyResponse, dailyResponse] = await Promise.all([
          fetch(`${baseUrl}/api/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`),
          fetch(`${baseUrl}/api/gridpoints/${gridId}/${gridX},${gridY}/forecast`)
        ]);

        let hourlyData = null;
        let dailyData = null;

        if (hourlyResponse.ok) {
          const hourlyJson = await hourlyResponse.json();
          hourlyData = hourlyJson.properties?.periods || [];
        }

        if (dailyResponse.ok) {
          const dailyJson = await dailyResponse.json();
          dailyData = dailyJson.properties?.periods || [];
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
  }, [location]);

  return { forecastData, loading, error };
};