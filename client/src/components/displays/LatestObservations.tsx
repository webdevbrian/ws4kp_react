import React from 'react';
import { useNearbyStations } from '../../hooks/useNearbyStations';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

const LatestObservations: React.FC = () => {
  const { location } = useApp();
  const { stations, loading, error } = useNearbyStations();

  const shortenConditions = (text?: string) => {
    if (!text) return '';
    // Replace common prefixes to match style (e.g., "Mostly Clear" -> "M Clear")
    return text
      .replace(/\bMostly\b/gi, 'M')
      .replace(/\bPartly\b/gi, 'P')
      .replace(/\bPartially\b/gi, 'P')
      .replace(/\bPart\b/gi, 'P')
      .replace(/\bThunderstorms\b/gi, 'Tstorms')
      .replace(/\bThunderstorm\b/gi, 'Tstorm')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Let's try to make the location names a bit more compact
  const formatLocationName = (raw?: string) => {
    const name = (raw || '').trim();
    if (!name) return '';
    let base = name.split(',')[0].trim();
    base = base.replace(/\s+Airport.*$/i, '').trim();
    if (base.includes('-')) base = base.split('-')[0].trim();
    const tokens = base.split(/\s+/).filter(Boolean);
    const stop = new Set(['of', 'the', 'town', 'village', 'municipal', 'county']);
    const filtered = tokens.filter(t => !stop.has(t.toLowerCase()));
    const chosen = (filtered.length > 0 ? filtered : tokens).slice(0, 2);
    return chosen.join(' ');
  };

  return (
    <div className="display latest-observations-display">
      <HeaderBar titleLines={["Latest", "Observations"]} />
      <div className="main latest-observations">
        <div className="column-headers">
          <div className="temp show">°F</div>
          <div className="weather">WEATHER</div>
          <div className="wind">WIND</div>
        </div>

        <div className="observation-lines">
          {!location && <div style={{ color: 'white', fontFamily: 'Star4000', padding: '10px' }}>Enter a location to view observations</div>}
          {loading && <div style={{ color: 'white', fontFamily: 'Star4000', padding: '10px' }}>Loading observations...</div>}
          {error && <div style={{ color: 'white', fontFamily: 'Star4000', padding: '10px' }}>Error: {error}</div>}

          {stations.length > 0 && !loading && (
            stations.slice(0, 7).map((s) => (
              <div key={s.stationId} className="observation-row">
                <div className="location">{formatLocationName(s.name)}</div>
                <div className="temp">{s.temperature !== undefined ? Math.round(s.temperature) : ''}</div>
                <div className="weather">{shortenConditions(s.conditions)}</div>
                <div className="wind">
                  <span className="dir">{s.windDirection || ''}</span>
                  <span className="spd">{s.windSpeed !== undefined ? Math.round(s.windSpeed) : ''}</span>
                </div>
              </div>
            ))
          )}

          {stations.length === 0 && !loading && location && (
            <div style={{ color: 'white', fontFamily: 'Star4000', padding: '10px' }}>No observation data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestObservations;