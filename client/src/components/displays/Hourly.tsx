import React from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useApp } from '../../contexts/AppContext';

const Hourly: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}${ampm}`;
  };

  return (
    <div className="display hourly-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px', paddingBottom: '10px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Hourly Forecast</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          {location?.city && `${location.city}, ${location.state}`}
        </div>
      </div>
      <div className="content" style={{ height: '350px', overflowY: 'auto' }}>
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading forecast...</p>}
        {error && <p>Error: {error}</p>}
        {forecastData.hourly && !loading && (
          <div className="hourly-list">
            {forecastData.hourly.slice(0, 24).map((hour, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                alignItems: 'center'
              }}>
                <div style={{ width: '60px' }}>{formatTime(hour.startTime)}</div>
                <div style={{ flex: 1, marginLeft: '20px' }}>{hour.shortForecast}</div>
                <div style={{ width: '60px', textAlign: 'right' }}>{hour.temperature}°{hour.temperatureUnit}</div>
                <div style={{ width: '100px', textAlign: 'right' }}>{hour.windDirection} {hour.windSpeed}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hourly;