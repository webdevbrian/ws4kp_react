import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

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

  const moonFor = (d: Date) => {
    // Simple moon phase approximation (0=new, 0.5=full)
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    let r = year % 100;
    r %= 19;
    if (r > 9) r -= 19;
    r = ((r * 11) % 30) + month + day;
    if (month < 3) r += 2;
    const phaseIndex = (r < 0 ? r + 30 : r) / 30; // 0..1
    return { phaseIndex };
  };

  const wrapDiff = (a: number, b: number) => {
    const d = Math.abs(a - b);
    return Math.min(d, 1 - d);
  };

  const findNextPhase = (start: Date, target: number) => {
    const d = new Date(start);
    for (let i = 0; i < 60; i++) {
      const { phaseIndex } = moonFor(d);
      if (wrapDiff(phaseIndex, target) <= 0.03) {
        return new Date(d);
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  };

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
    <>
      <HeaderBar titleLines={["Almanac"]} />
      <div className="main almanac">
        {!location && <p>Please enter a location to view almanac data</p>}
        {location && (
          <>
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

                <div className="moon">
                  <div className="title">Moon</div>
                  {(() => {
                    const now = new Date();
                    const items = [
                      { label: 'New Moon', file: 'New-Moon.gif', v: 0 },
                      { label: 'First Quarter', file: 'First-Quarter.gif', v: 0.25 },
                      { label: 'Full Moon', file: 'Full-Moon.gif', v: 0.5 },
                      { label: 'Last Quarter', file: 'Last-Quarter.gif', v: 0.75 },
                    ] as const;
                    const fmt = (d: Date) => {
                      const mon = d.toLocaleDateString(undefined, { month: 'short' });
                      const day = d.toLocaleDateString(undefined, { day: '2-digit' });
                      return `${mon}-${day}`;
                    };
                    const imgSrc = (file: string) => `/images/icons/moon-phases/${file}`;

                    const results = items.map(item => {
                      const date = findNextPhase(now, item.v) || now;
                      return { ...item, date };
                    });

                    return (
                      <>
                        {results.map(r => (
                          <div className="day" key={r.label}>
                            <div className="icon">
                              <img src={imgSrc(r.file)} alt={r.label} />
                            </div>
                            <div className="date">{fmt(r.date)}</div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Almanac;