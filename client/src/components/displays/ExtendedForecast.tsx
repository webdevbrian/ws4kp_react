import React from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useApp } from '../../contexts/AppContext';

const ExtendedForecast: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  return (
    <div className="display extended-forecast-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px', paddingBottom: '10px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Extended Forecast</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          {location?.city && `${location.city}, ${location.state}`}
        </div>
      </div>
      <div className="content" style={{ height: '350px', overflowY: 'auto' }}>
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading forecast...</p>}
        {error && <p>Error: {error}</p>}
        {forecastData.daily && !loading && (
          <div className="daily-list">
            {forecastData.daily.slice(0, 14).map((day, index) => (
              <div key={index} style={{
                padding: '15px',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                marginBottom: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  <span>{day.name.includes('Night') ? `${getDayName(day.startTime)} Night` : getDayName(day.startTime)}</span>
                  <span>{day.temperature}°{day.temperatureUnit}</span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  {day.detailedForecast}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtendedForecast;