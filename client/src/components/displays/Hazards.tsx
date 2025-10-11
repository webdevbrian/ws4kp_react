import React from 'react';
import { useAlertsData } from '../../hooks/useAlertsData';
import { useApp } from '../../contexts/AppContext';

const Hazards: React.FC = () => {
  const { location } = useApp();
  const { alerts, loading, error } = useAlertsData();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'extreme': return '#FF0000';
      case 'severe': return '#FFA500';
      case 'moderate': return '#FFFF00';
      case 'minor': return '#00FF00';
      default: return '#FFFFFF';
    }
  };

  return (
    <div className="display hazards-display" style={{ backgroundColor: '#001a33', color: 'white', padding: '20px' }}>
      <div className="header" style={{ borderBottom: '2px solid white', marginBottom: '20px', paddingBottom: '10px' }}>
        <div className="title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Weather Hazards</div>
        <div style={{ fontSize: '14px', marginTop: '5px' }}>
          {location?.city && `${location.city}, ${location.state}`}
        </div>
      </div>
      <div className="content" style={{ height: '350px', overflowY: 'auto' }}>
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading alerts...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && alerts.length === 0 && location && (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
            No active weather alerts for this location
          </div>
        )}
        {alerts.length > 0 && !loading && (
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={alert.id || index} style={{
                padding: '15px',
                marginBottom: '15px',
                border: `2px solid ${getSeverityColor(alert.severity)}`,
                borderRadius: '5px',
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: getSeverityColor(alert.severity),
                  marginBottom: '10px'
                }}>
                  {alert.headline}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                  <strong>Event:</strong> {alert.event}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                  <strong>Severity:</strong> {alert.severity} | <strong>Urgency:</strong> {alert.urgency}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                  <strong>Expires:</strong> {formatDate(alert.expires)}
                </div>
                {alert.instruction && (
                  <div style={{ fontSize: '14px', marginTop: '10px', fontStyle: 'italic' }}>
                    {alert.instruction}
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

export default Hazards;