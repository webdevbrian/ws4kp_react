import { useState, useEffect } from 'react';
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

        const pointResponse = await fetch(pointUrl);
        if (!pointResponse.ok) {
          throw new Error('Failed to fetch location data');
        }

        const pointData = await pointResponse.json();
        const stationsUrl = pointData.properties.observationStations;

        // Fetch the list of stations
        const stationsApiUrl = stationsUrl.replace('https://api.weather.gov', '/api');
        const stationsResponse = await fetch(`${baseUrl}${stationsApiUrl}`);

        if (!stationsResponse.ok) {
          throw new Error('Failed to fetch stations');
        }

        const stationsData = await stationsResponse.json();
        const stationsList = stationsData.features || [];

        // Fetch observations for up to 5 nearest stations
        const nearbyStations: StationObservation[] = [];

        for (let i = 0; i < Math.min(5, stationsList.length); i++) {
          const station = stationsList[i];
          const stationId = station.properties.stationIdentifier;

          try {
            const obsUrl = `${baseUrl}/api/stations/${stationId}/observations/latest`;
            const obsResponse = await fetch(obsUrl);

            if (obsResponse.ok) {
              const obsData = await obsResponse.json();
              const props = obsData.properties;

              nearbyStations.push({
                stationId,
                name: station.properties.name,
                distance: Math.round(station.properties.distance?.value / 1609.34) || 0, // Convert to miles
                temperature: props.temperature?.value ?
                  Math.round(props.temperature.value * 9/5 + 32) : undefined,
                conditions: props.textDescription,
                windSpeed: props.windSpeed?.value ?
                  Math.round(props.windSpeed.value * 2.237) : undefined,
                windDirection: props.windDirection?.value !== null ?
                  getWindDirection(props.windDirection.value) : undefined,
                humidity: props.relativeHumidity?.value,
                pressure: props.barometricPressure?.value ?
                  (props.barometricPressure.value / 100).toFixed(2) : undefined,
                timestamp: props.timestamp,
              });
            }
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
  }, [location]);

  return { stations, loading, error };
};

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}