import React from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useApp } from '../../contexts/AppContext';

const LocalForecast: React.FC = () => {
  const { location } = useApp();
  const { weatherData } = useWeatherData();
  const { forecastData, loading, error } = useForecastData();

  // Get next few periods for local forecast
  const getUpcomingPeriods = () => {
    if (!forecastData.daily) return [];
    return forecastData.daily.slice(0, 4); // Today, tonight, tomorrow, tomorrow night
  };

  return (
    <div className="display local-forecast-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px', paddingBottom: '10px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Local Forecast</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          {location?.city && `${location.city}, ${location.state}`}
        </div>
      </div>
      <div className="content" style={{ height: '350px', overflowY: 'auto' }}>
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading forecast...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && location && (
          <div>
            {/* Current Conditions Summary */}
            {weatherData && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '5px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Current Conditions
                </div>
                <div style={{ fontSize: '16px' }}>
                  {weatherData.temperature}°F - {weatherData.conditions}
                </div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>
                  Wind: {weatherData.windDirection} {weatherData.windSpeed} mph |
                  Humidity: {weatherData.humidity}%
                </div>
              </div>
            )}

            {/* Forecast Periods */}
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
              Forecast
            </div>
            {getUpcomingPeriods().map((period, index) => (
              <div key={index} style={{
                marginBottom: '15px',
                padding: '10px',
                borderLeft: '3px solid #4CAF50'
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {period.name}: {period.temperature}°{period.temperatureUnit}
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  {period.shortForecast}
                </div>
                {period.windSpeed && (
                  <div style={{ fontSize: '13px', marginTop: '5px', color: '#aaa' }}>
                    Wind: {period.windDirection} {period.windSpeed}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalForecast;