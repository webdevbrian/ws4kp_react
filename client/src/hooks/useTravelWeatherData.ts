import { useState, useEffect } from 'react';
import { TravelCity } from './useTravelCities';

export interface CityWeather {
  city: string;
  temperature?: number;
  high?: number;
  low?: number;
  conditions?: string;
  icon?: string;
  error?: string;
}

export const useTravelWeatherData = (cities: TravelCity[]) => {
  const [weatherData, setWeatherData] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cities || cities.length === 0) return;

    const fetchWeatherForCities = async () => {
      console.log('Fetching weather for', cities.length, 'cities');
      try {
        setLoading(true);
        setError(null);

        const weatherPromises = cities.map(async (city) => {
          try {
            // First get the gridpoint data
            const lat = city.Latitude.toFixed(4);
            const lon = city.Longitude.toFixed(4);
            const pointsUrl = `/api/points/${lat},${lon}`;

            const pointsResponse = await fetch(pointsUrl);
            if (!pointsResponse.ok) {
              throw new Error('Failed to fetch points');
            }

            const contentType = pointsResponse.headers.get('content-type');
            if (!contentType || (!contentType.includes('application/json') && !contentType.includes('application/geo+json'))) {
              throw new Error('Invalid response type');
            }

            const pointsData = await pointsResponse.json();
            const forecastUrl = pointsData.properties.forecast;
            const observationStationsUrl = pointsData.properties.observationStations;

            // Fetch forecast data for high/low temperatures
            const forecastResponse = await fetch(forecastUrl.replace('https://api.weather.gov', '/api'));
            const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;

            // Fetch current observation
            const stationsResponse = await fetch(observationStationsUrl.replace('https://api.weather.gov', '/api'));
            const stationsData = stationsResponse.ok ? await stationsResponse.json() : null;

            let currentTemp: number | undefined;
            let conditions: string | undefined;
            let icon: string | undefined;

            if (stationsData && stationsData.features && stationsData.features.length > 0) {
              const stationId = stationsData.features[0].properties.stationIdentifier;
              const observationUrl = `/api/stations/${stationId}/observations/latest`;

              try {
                const observationResponse = await fetch(observationUrl);
                if (observationResponse.ok) {
                  const observationData = await observationResponse.json();
                  const props = observationData.properties;

                  if (props.temperature && props.temperature.value !== null) {
                    currentTemp = Math.round(props.temperature.value * 9/5 + 32);
                  }

                  // Shorten conditions text for display
                  conditions = props.textDescription;
                  if (conditions) {
                    // Remove "L Rain and " prefix when followed by Fog/Mist
                    conditions = conditions.replace(/^L Rain and (Fog\/Mist)/i, '$1');
                  }
                  icon = props.icon ? props.icon.split(',')[0].split('/').pop()?.replace('?size=medium', '') : undefined;
                }
              } catch (err) {
                console.error('Error fetching observation for', city.Name, err);
              }
            }

            // Get high/low from forecast
            let high: number | undefined;
            let low: number | undefined;

            if (forecastData && forecastData.properties && forecastData.properties.periods) {
              const periods = forecastData.properties.periods.slice(0, 2);

              for (const period of periods) {
                if (period.isDaytime) {
                  high = period.temperature;
                } else {
                  low = period.temperature;
                }
              }

              // If we don't have current conditions but have forecast, use first period
              if (!conditions && periods[0]) {
                conditions = periods[0].shortForecast;
                if (!icon && periods[0].icon) {
                  icon = periods[0].icon.split(',')[0].split('/').pop()?.replace('?size=medium', '');
                }
              }
            }

            return {
              city: city.Name,
              temperature: currentTemp,
              high,
              low,
              conditions,
              icon
            };
          } catch (err) {
            console.error(`Error fetching weather for ${city.Name}:`, err);
            return {
              city: city.Name,
              error: 'Failed to load'
            };
          }
        });

        const results = await Promise.all(weatherPromises);
        console.log('Travel weather results:', results);
        setWeatherData(results);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherForCities();
  }, [cities]);

  return { weatherData, loading, error };
};