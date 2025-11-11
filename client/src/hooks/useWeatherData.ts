import { useState, useEffect } from 'react';
import { cachedJson } from '../utils/cachedFetch';
import { useApp } from '../contexts/AppContext';

interface WeatherData {
  temperature?: number;
  conditions?: string;
  humidity?: number;
  windSpeed?: number;
  windDirection?: string;
  pressure?: number;
  visibility?: number;
  dewpoint?: number;
  ceiling?: number;
  windChill?: number;
  icon?: string;
  timestamp?: string;
}

export const useWeatherData = () => {
  const { location } = useApp();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
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
      setWeatherData(null);
      return;
    }

    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);

      // Use relative URLs to work with both dev server and preview
      const baseUrl = '';

      try {
        // First, get the grid point for the location
        // Round to 4 decimal places to avoid Weather.gov redirect issues
        const lat = location.latitude.toFixed(4);
        const lon = location.longitude.toFixed(4);
        const pointPath = `/api/points/${lat},${lon}`;
        const pointUrl = baseUrl + pointPath;
        console.log('Fetching weather data from:', pointUrl);

        const pointData = await cachedJson<any>(pointUrl, 30 * 60 * 1000);
        console.log('Point data received:', pointData);

        if (!pointData.properties) {
          throw new Error('Invalid response: missing properties');
        }

        // gridId/gridX/gridY not needed for latest observations fetch

        // Get the observation stations URL
        const stationsUrl = pointData.properties.observationStations;
        if (!stationsUrl) {
          throw new Error('No observation stations found for this location');
        }

        // Fetch the list of stations using direct backend URL
        const stationsApiUrl = stationsUrl.replace('https://api.weather.gov', baseUrl + '/api');
        console.log('Fetching stations from:', stationsApiUrl);
        const stationsData = await cachedJson<any>(stationsApiUrl, 30 * 60 * 1000);
        const stations = stationsData.features || stationsData.observationStations || [];

        if (stations.length === 0) {
          throw new Error('No observation stations available');
        }

        // Get the first station's ID
        const firstStation = stations[0];
        const stationId = typeof firstStation === 'string'
          ? firstStation.split('/').pop()
          : firstStation.properties?.stationIdentifier;

        if (stationId) {
          console.log('Fetching observations from station:', stationId);
          const obsUrl = baseUrl ? `${baseUrl}/api/stations/${stationId}/observations/latest` : `/api/stations/${stationId}/observations/latest`;

          try {
            const obsData = await cachedJson<any>(obsUrl, 30 * 60 * 1000);

            const props = obsData.properties;

            // Parse ceiling from cloudLayers (lowest cloud base height)
            const getCeiling = (cloudLayers: any[]): number | undefined => {
              if (!Array.isArray(cloudLayers) || cloudLayers.length === 0) return undefined;

              // Find lowest cloud base that's not "CLR" (clear)
              const validLayers = cloudLayers.filter(layer =>
                layer.amount !== 'CLR' && layer.base?.value !== null
              );

              if (validLayers.length === 0) return undefined;

              const lowestBase = Math.min(...validLayers.map(layer => layer.base.value));
              // Convert meters to feet
              return Math.round(lowestBase * 3.28084);
            };

            // Calculate wind chill
            const calculateWindChill = (tempF: number, windSpeedMph: number): number | undefined => {
              // Wind chill only applies when temp ≤ 50°F and wind > 3mph
              if (tempF > 50 || windSpeedMph <= 3) return undefined;

              const wc = 35.74 + 0.6215 * tempF - 35.75 * Math.pow(windSpeedMph, 0.16)
                + 0.4275 * tempF * Math.pow(windSpeedMph, 0.16);
              return Math.round(wc);
            };

            const tempF = props.temperature?.value ?
              Math.round(props.temperature.value * 9/5 + 32) : undefined;
            const windSpeedMph = toMph(props.windSpeed?.value, (props.windSpeed as any)?.unitCode);

            setWeatherData({
              temperature: tempF,
              conditions: props.textDescription,
              humidity: props.relativeHumidity?.value,
              windSpeed: windSpeedMph,
              windDirection: props.windDirection?.value !== null ?
                getWindDirection(props.windDirection.value) : undefined,
              pressure: props.barometricPressure?.value ?
                Math.round((props.barometricPressure.value * 0.0002953) * 100) / 100 : undefined,
              visibility: props.visibility?.value ?
                Math.round(props.visibility.value / 1609.34) : undefined,
              dewpoint: props.dewpoint?.value ?
                Math.round(props.dewpoint.value * 9/5 + 32) : undefined,
              ceiling: getCeiling(props.cloudLayers),
              windChill: tempF && windSpeedMph ? calculateWindChill(tempF, windSpeedMph) : undefined,
              icon: props.icon,
              timestamp: props.timestamp,
            });
          } catch (obsError) {
            console.warn('Failed to fetch observations from station:', stationId, obsError);
            // Continue without observation data - location is still valid
          }
        }
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();

    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetchWeatherData();
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [location]);

  return { weatherData, loading, error };
};

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}