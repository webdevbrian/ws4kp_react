import React from 'react';
import { useAlertsData } from '../../hooks/useAlertsData';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

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

  return (
    <div className="display hazards-display">
      <HeaderBar titleLines={["Weather", "Hazards"]} />
      <div className="main hazards">
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading alerts...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && alerts.length === 0 && location && (
          <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Star4000', fontSize: 18 }}>
            No active weather alerts for this location
          </div>
        )}
        {alerts.length > 0 && !loading && (
          <div className="hazard-lines">
            {alerts.map((alert, index) => (
              <div key={alert.id || index} className="hazard" style={{}}>
                <div style={{ fontFamily: 'Star4000', fontSize: 22, marginBottom: 6 }}>{alert.headline}</div>
                <div style={{ fontFamily: 'Star4000 Small', fontSize: 18 }}>Event: {alert.event} • Severity: {alert.severity} • Urgency: {alert.urgency}</div>
                <div style={{ fontFamily: 'Star4000 Small', fontSize: 18, marginTop: 4 }}>Expires: {formatDate(alert.expires)}</div>
                {alert.instruction && (
                  <div style={{ fontFamily: 'Star4000 Small', fontSize: 18, marginTop: 8 }}>{alert.instruction}</div>
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