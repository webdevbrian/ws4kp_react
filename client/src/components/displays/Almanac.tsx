import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';

type SunTimes = {
  sunrise?: string;
  sunset?: string;
};

const toLocalTime = (isoUtc?: string) => {
  if (!isoUtc) return '--:--';
  try {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

const Almanac: React.FC = () => {
  const { location } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<SunTimes>({});
  const [tomorrow, setTomorrow] = useState<SunTimes>({});

  useEffect(() => {
    if (!location) {
      setToday({});
      setTomorrow({});
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const lat = location.latitude;
        const lon = location.longitude;
        const now = new Date();
        const next = new Date(now);
        next.setDate(now.getDate() + 1);

        const urlFor = (dateStr: string) =>
          `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`;

        const [res1, res2] = await Promise.all([fetch(urlFor(formatDate(now))), fetch(urlFor(formatDate(next)))]);

        if (!res1.ok || !res2.ok) {
          throw new Error('Failed to fetch almanac data');
        }

        const j1 = await res1.json();
        const j2 = await res2.json();

        if (j1.status !== 'OK' || j2.status !== 'OK') {
          throw new Error('Almanac API returned an error');
        }

        setToday({ sunrise: j1.results.sunrise, sunset: j1.results.sunset });
        setTomorrow({ sunrise: j2.results.sunrise, sunset: j2.results.sunset });
      } catch (e: any) {
        setError(e?.message || 'Unable to load almanac');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [location]);

  return (
    <div className="display almanac-display">
      <div className="header">
        <div className="title">Almanac</div>
      </div>
      <div className="content">
        {!location && <p>Please enter a location to view almanac data</p>}
        {location && (
          <div className="main almanac">
            {loading && <p>Loading almanac...</p>}
            {error && <p>Error: {error}</p>}
            {!loading && !error && (
              <>
                <div className="sun">
                  <div className="grid-item row-label" style={{ gridColumn: 1, gridRow: 2 }}>Sunrise:</div>
                  <div className="grid-item row-label" style={{ gridColumn: 1, gridRow: 3 }}>Sunset:</div>

                  <div className="grid-item header" style={{ gridColumn: 2, gridRow: 1 }}>Today</div>
                  <div className="grid-item time" style={{ gridColumn: 2, gridRow: 2 }}>{toLocalTime(today.sunrise)}</div>
                  <div className="grid-item time" style={{ gridColumn: 2, gridRow: 3 }}>{toLocalTime(today.sunset)}</div>

                  <div className="grid-item header" style={{ gridColumn: 3, gridRow: 1 }}>Tomorrow</div>
                  <div className="grid-item time" style={{ gridColumn: 3, gridRow: 2 }}>{toLocalTime(tomorrow.sunrise)}</div>
                  <div className="grid-item time" style={{ gridColumn: 3, gridRow: 3 }}>{toLocalTime(tomorrow.sunset)}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Almanac;