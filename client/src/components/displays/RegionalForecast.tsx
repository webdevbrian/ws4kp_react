import React from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useApp } from '../../contexts/AppContext';

const RegionalForecast: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();

  // Get the next 5 days of forecasts (day periods only)
  const getRegionalForecast = () => {
    if (!forecastData.daily) return [];
    // Filter to get only daytime periods for next 5 days
    return forecastData.daily
      .filter(period => period.isDaytime)
      .slice(0, 5);
  };

  const getDayAbbreviation = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  const getMonthDay = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="display regional-forecast-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px', paddingBottom: '10px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Regional Forecast</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          {location?.city && `${location.city}, ${location.state} Region`}
        </div>
      </div>
      <div className="content" style={{ height: '350px' }}>
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading forecast...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && location && (
          <div>
            {/* 5-Day Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '10px',
              marginBottom: '30px'
            }}>
              {getRegionalForecast().map((day, index) => (
                <div key={index} style={{
                  textAlign: 'center',
                  padding: '10px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '5px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {getDayAbbreviation(day.startTime)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
                    {getMonthDay(day.startTime)}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                    {day.temperature}°
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: '1.3' }}>
                    {day.shortForecast}
                  </div>
                </div>
              ))}
            </div>

            {/* Regional Summary */}
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '5px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                Regional Summary
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {forecastData.daily && forecastData.daily[0] && (
                  <>
                    <p style={{ marginBottom: '10px' }}>
                      <strong>Today:</strong> {forecastData.daily[0].detailedForecast}
                    </p>
                    {forecastData.daily[1] && (
                      <p>
                        <strong>Tonight:</strong> {forecastData.daily[1].detailedForecast}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionalForecast;