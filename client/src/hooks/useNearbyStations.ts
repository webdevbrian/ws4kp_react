import { useState, useEffect } from 'react';
import { cachedJson } from '../utils/cachedFetch';
import { useApp } from '../contexts/AppContext';

interface StationObservation {
  stationId: string;
  name: string;
  distance: number;
  temperature?: number;
  conditions?: string;
  windSpeed?: number;
  windDirection?: string;
  humidity?: number;
  pressure?: number;
  timestamp?: string;
}

export const useNearbyStations = () => {
  const { location } = useApp();
  const [stations, setStations] = useState<StationObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toMph = (value?: number | null, unitCode?: string | null): number | undefined => {
    if (value === null || value === undefined || isNaN(value as any)) return undefined;
    const u = (unitCode || '').toLowerCase();
    const v = Number(value);
    if (u.includes('wmo') && u.includes('m_s')) return Math.round(v * 2.23694);
    if (u.includes('m_s')) return Math.round(v * 2.23694);
    if (u.includes('km_h') || u.includes('km/h')) return Math.round(v / 1.60934);
    if (u.includes('kn') || u.includes('kt')) return Math.round(v * 1.15078);
    if (u.includes('mph') || u.includes('mi_h')) return Math.round(v);
    // Fallback: assume m/s (NWS default)
    return Math.round(v * 2.23694);
  };

  useEffect(() => {
    if (!location) {
      setStations([]);
      return;
    }

    const fetchNearbyStations = async () => {
      setLoading(true);
      setError(null);

      const baseUrl = 'http://localhost:8080';

      try {
        // Get the grid point and stations
        const lat = location.latitude.toFixed(4);
        const lon = location.longitude.toFixed(4);
        const pointUrl = `${baseUrl}/api/points/${lat},${lon}`;

        const pointData = await cachedJson<any>(pointUrl, 30 * 60 * 1000);
        const stationsUrl = pointData.properties.observationStations;

        // Fetch the list of stations
        const stationsApiUrl = stationsUrl.replace('https://api.weather.gov', '/api');
        const stationsData = await cachedJson<any>(`${baseUrl}${stationsApiUrl}`, 30 * 60 * 1000);
        const stationsList = stationsData.features || [];

        // Fetch observations for up to 5 nearest stations
        const nearbyStations: StationObservation[] = [];

        for (let i = 0; i < Math.min(5, stationsList.length); i++) {
          const station = stationsList[i];
          const stationId = station.properties.stationIdentifier;

          try {
            const obsUrl = `${baseUrl}/api/stations/${stationId}/observations/latest`;
            const obsData = await cachedJson<any>(obsUrl, 30 * 60 * 1000);

            const props = obsData.properties;

            const mph = toMph(props.windSpeed?.value, (props.windSpeed as any)?.unitCode);
            nearbyStations.push({
              stationId,
              name: station.properties.name,
              distance: Math.round(station.properties.distance?.value / 1609.34) || 0, // Convert to miles
              temperature: props.temperature?.value ?
                Math.round(props.temperature.value * 9/5 + 32) : undefined,
              conditions: props.textDescription,
              windSpeed: mph,
              windDirection: props.windDirection?.value !== null ?
                getWindDirection(props.windDirection.value) : undefined,
              humidity: props.relativeHumidity?.value,
              pressure: props.barometricPressure?.value ?
                Math.round((props.barometricPressure.value / 100) * 100) / 100 : undefined,
              timestamp: props.timestamp,
            });
          } catch (err) {
            console.warn(`Failed to fetch observations for station ${stationId}`);
          }
        }

        setStations(nearbyStations);
      } catch (err) {
        console.error('Error fetching nearby stations:', err);
        setError('Failed to load station data');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyStations();

    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetchNearbyStations();
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [location]);

  return { stations, loading, error };
};

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}