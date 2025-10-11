import React from 'react';
import { useNearbyStations } from '../../hooks/useNearbyStations';
import { useApp } from '../../contexts/AppContext';

const LatestObservations: React.FC = () => {
  const { location } = useApp();
  const { stations, loading, error } = useNearbyStations();

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="display latest-observations-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px', paddingBottom: '10px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Latest Observations</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          {location?.city && `Near ${location.city}, ${location.state}`}
        </div>
      </div>
      <div className="content" style={{ height: '350px', overflowY: 'auto' }}>
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading observations...</p>}
        {error && <p>Error: {error}</p>}
        {stations.length > 0 && !loading && (
          <div className="stations-list">
            {stations.map((station, index) => (
              <div key={station.stationId} style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '5px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontWeight: 'bold'
                }}>
                  <span>{station.name}</span>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>
                    {station.distance} mi away
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {station.temperature !== undefined && (
                    <div>
                      <span style={{ color: '#aaa' }}>Temp: </span>
                      <span>{station.temperature}°F</span>
                    </div>
                  )}
                  {station.conditions && (
                    <div>
                      <span style={{ color: '#aaa' }}>Sky: </span>
                      <span>{station.conditions}</span>
                    </div>
                  )}
                  {station.windSpeed !== undefined && station.windDirection && (
                    <div>
                      <span style={{ color: '#aaa' }}>Wind: </span>
                      <span>{station.windDirection} {station.windSpeed} mph</span>
                    </div>
                  )}
                  {station.humidity !== undefined && (
                    <div>
                      <span style={{ color: '#aaa' }}>Humidity: </span>
                      <span>{Math.round(station.humidity)}%</span>
                    </div>
                  )}
                  {station.pressure && (
                    <div>
                      <span style={{ color: '#aaa' }}>Pressure: </span>
                      <span>{station.pressure} mb</span>
                    </div>
                  )}
                  <div style={{ gridColumn: 'span 2', fontSize: '12px', color: '#888', marginTop: '5px' }}>
                    Observed: {formatTime(station.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {stations.length === 0 && !loading && location && (
          <p>No observation data available</p>
        )}
      </div>
    </div>
  );
};

export default LatestObservations;