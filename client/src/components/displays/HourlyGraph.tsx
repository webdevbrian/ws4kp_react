import React, { useMemo } from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useApp } from '../../contexts/AppContext';

const HourlyGraph: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();

  const graphData = useMemo(() => {
    if (!forecastData.hourly || forecastData.hourly.length === 0) return null;

    // Get next 24 hours
    const hours = forecastData.hourly.slice(0, 24);

    // Find min and max temperatures for scaling
    const temps = hours.map(h => h.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const range = maxTemp - minTemp || 1;

    // Add some padding to the range
    const paddedMin = minTemp - 5;
    const paddedMax = maxTemp + 5;
    const paddedRange = paddedMax - paddedMin;

    return {
      hours,
      minTemp: paddedMin,
      maxTemp: paddedMax,
      range: paddedRange,
    };
  }, [forecastData.hourly]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}${ampm}`;
  };

  const getBarHeight = (temp: number) => {
    if (!graphData) return 0;
    return ((temp - graphData.minTemp) / graphData.range) * 250; // 250px max height
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 90) return '#ff4444';
    if (temp >= 80) return '#ff8800';
    if (temp >= 70) return '#ffcc00';
    if (temp >= 60) return '#88dd00';
    if (temp >= 50) return '#00dd88';
    if (temp >= 40) return '#00aaff';
    if (temp >= 32) return '#0066ff';
    return '#aa00ff';
  };

  return (
    <div className="display hourly-graph-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px', paddingBottom: '10px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Temperature Trends</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          {location?.city && `${location.city}, ${location.state} - Next 24 Hours`}
        </div>
      </div>
      <div className="content" style={{ height: '350px' }}>
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading forecast...</p>}
        {error && <p>Error: {error}</p>}
        {graphData && !loading && (
          <div style={{ position: 'relative', height: '100%' }}>
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', left: '0', top: '0', height: '280px', width: '40px' }}>
              {[0, 1, 2, 3, 4].map(i => {
                const temp = Math.round(graphData.maxTemp - (i * graphData.range / 4));
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `${i * 25}%`,
                    right: '5px',
                    fontSize: '12px',
                    textAlign: 'right'
                  }}>
                    {temp}°
                  </div>
                );
              })}
            </div>

            {/* Graph area */}
            <div style={{
              marginLeft: '50px',
              height: '280px',
              position: 'relative',
              borderLeft: '2px solid white',
              borderBottom: '2px solid white',
              overflow: 'hidden'
            }}>
              {/* Grid lines */}
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  top: `${(i + 1) * 25}%`,
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed rgba(255,255,255,0.2)'
                }} />
              ))}

              {/* Temperature bars */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '100%',
                gap: '2px',
                padding: '0 5px'
              }}>
                {graphData.hours.map((hour, index) => {
                  const barHeight = getBarHeight(hour.temperature);
                  const isCurrentHour = index === 0;

                  return (
                    <div key={index} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      position: 'relative'
                    }}>
                      {/* Temperature value on top of bar */}
                      {(index % 3 === 0) && (
                        <div style={{
                          position: 'absolute',
                          bottom: `${barHeight + 5}px`,
                          fontSize: '11px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}>
                          {hour.temperature}°
                        </div>
                      )}

                      {/* Temperature bar */}
                      <div style={{
                        width: '100%',
                        height: `${barHeight}px`,
                        backgroundColor: getTemperatureColor(hour.temperature),
                        borderRadius: '2px 2px 0 0',
                        opacity: isCurrentHour ? 1 : 0.8,
                        border: isCurrentHour ? '2px solid white' : 'none',
                        transition: 'height 0.3s ease'
                      }} />
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div style={{
                display: 'flex',
                marginTop: '5px',
                paddingLeft: '5px',
                paddingRight: '5px'
              }}>
                {graphData.hours.map((hour, index) => (
                  <div key={index} style={{
                    flex: 1,
                    fontSize: '10px',
                    textAlign: 'center',
                    visibility: index % 3 === 0 ? 'visible' : 'hidden'
                  }}>
                    {formatTime(hour.startTime)}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{
              marginTop: '20px',
              marginLeft: '50px',
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '12px'
            }}>
              <div>High: {Math.max(...graphData.hours.map(h => h.temperature))}°F</div>
              <div>Low: {Math.min(...graphData.hours.map(h => h.temperature))}°F</div>
              <div>Avg: {Math.round(graphData.hours.reduce((sum, h) => sum + h.temperature, 0) / graphData.hours.length)}°F</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HourlyGraph;