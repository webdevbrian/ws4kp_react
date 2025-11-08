import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

const LocationDataFetcher: React.FC = () => {
  const { location, setLocation } = useApp();

  useEffect(() => {
    if (!location || !location.latitude || !location.longitude) return;

    // Skip if we already have all the weather data
    if (location.stationId && location.radarId && location.officeId && location.gridX && location.gridY) return;

    const fetchWeatherData = async () => {
      try {
        // Fetch point data from Weather.gov API
        const lat = location.latitude.toFixed(4);
        const lon = location.longitude.toFixed(4);
        const pointsUrl = `/api/points/${lat},${lon}`;

        const response = await fetch(pointsUrl);
        if (!response.ok) return;

        const data = await response.json();
        const props = data.properties;

        if (props) {
          // Extract all the weather-related data
          const updatedLocation = {
            ...location,
            // Preserve or extract city and state
            city: location.city || props.city || props.relativeLocation?.properties?.city,
            state: location.state || props.state || props.relativeLocation?.properties?.state,
            officeId: props.cwa || props.forecastOffice?.split('/')?.pop(),
            gridX: props.gridX,
            gridY: props.gridY,
            radarId: props.radarStation,
            zoneId: props.forecastZone?.split('/')?.pop(),
            stationId: props.observationStations?.split('/')?.pop()?.split(',')[0],
          };

          // Also try to get the nearest station if we have the stations URL
          if (props.observationStations) {
            try {
              const stationsUrl = props.observationStations.replace('https://api.weather.gov', '/api');
              const stationsResponse = await fetch(stationsUrl);
              if (stationsResponse.ok) {
                const stationsData = await stationsResponse.json();
                const stations = stationsData.features || stationsData.observationStations || [];
                if (stations.length > 0) {
                  const firstStation = stations[0];
                  const stationId = typeof firstStation === 'string'
                    ? firstStation.split('/').pop()
                    : firstStation.properties?.stationIdentifier;
                  if (stationId) {
                    updatedLocation.stationId = stationId;
                  }
                }
              }
            } catch (err) {
              console.warn('Failed to fetch station list:', err);
            }
          }

          console.log('Updating location with weather data:', updatedLocation);
          setLocation(updatedLocation);
        }
      } catch (err) {
        console.error('Error fetching weather location data:', err);
      }
    };

    fetchWeatherData();
  }, [location?.latitude, location?.longitude]);

  return null; // This component doesn't render anything
};

export default LocationDataFetcher;