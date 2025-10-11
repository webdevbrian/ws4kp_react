import React from 'react';
import { useTravelCities } from '../../hooks/useTravelCities';
import { useTravelWeatherData } from '../../hooks/useTravelWeatherData';
import { getWeatherIconPath } from '../../utils/weatherIcons';

const Travel: React.FC = () => {
  const { cities, loading: citiesLoading, error: citiesError } = useTravelCities();
  const { weatherData, loading: weatherLoading, error: weatherError } = useTravelWeatherData(cities);

  const isLoading = citiesLoading || weatherLoading;
  const error = citiesError || weatherError;

  return (
    <div className="weather-display travel">
      <div className="main travel">
        <div className="column-headers">
          <div className="temp low">LOW</div>
          <div className="temp high">HIGH</div>
        </div>
        <div className="travel-lines">
          {isLoading && (
            <div className="travel-row">
              <div className="city">Loading travel cities...</div>
            </div>
          )}
          {error && (
            <div className="travel-row">
              <div className="city">Error: {error}</div>
            </div>
          )}
          {!isLoading && !error && weatherData.map((cityWeather, index) => (
            <div key={index} className="travel-row">
              <div className="city">{cityWeather.city}</div>
              {cityWeather.error ? (
                <div className="temp high" style={{ left: '400px' }}>{cityWeather.error}</div>
              ) : (
                <>
                  <div className="icon">
                    {(cityWeather.conditions || cityWeather.icon) && (
                      <img
                        src={getWeatherIconPath(cityWeather.conditions, cityWeather.icon)}
                        alt={cityWeather.conditions || 'Weather'}
                      />
                    )}
                  </div>
                  <div className="temp low">
                    {cityWeather.low !== undefined ? `${cityWeather.low}°` : '--'}
                  </div>
                  <div className="temp high">
                    {cityWeather.high !== undefined ? `${cityWeather.high}°` : '--'}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Travel;