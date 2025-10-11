import React from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useApp } from '../../contexts/AppContext';

const CurrentWeather: React.FC = () => {
  const { location } = useApp();
  const { weatherData, loading, error } = useWeatherData();

  console.log('CurrentWeather render:', { location, weatherData, loading, error });

  return (
    <div className="display current-weather-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px', minHeight: '400px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Current Weather</div>
      </div>
      <div className="content">
        <div className="current-weather-container">
          {!location && <p>Please enter a location to view weather data</p>}
          {loading && <p>Loading weather data...</p>}
          {error && <p>Error: {error}</p>}
          {weatherData && !loading && (
            <div className="weather-info">
              <div className="location-name">
                {location?.city ? `${location.city}, ${location.state}` : 'Current Location'}
              </div>
              <div className="current-conditions">
                <div className="temperature">
                  {weatherData.temperature !== undefined ? `${weatherData.temperature}°F` : '--°F'}
                </div>
                <div className="conditions">{weatherData.conditions || 'No data'}</div>
              </div>
              <div className="details">
                {weatherData.humidity !== undefined && (
                  <div>Humidity: {weatherData.humidity}%</div>
                )}
                {weatherData.windSpeed !== undefined && weatherData.windDirection && (
                  <div>Wind: {weatherData.windDirection} {weatherData.windSpeed} mph</div>
                )}
                {weatherData.pressure && (
                  <div>Pressure: {weatherData.pressure} mb</div>
                )}
                {weatherData.visibility !== undefined && (
                  <div>Visibility: {weatherData.visibility} mi</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentWeather;