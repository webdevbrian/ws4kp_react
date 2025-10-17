import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';
import SunCalc from 'suncalc';
import { DateTime } from 'luxon';

type SunTimes = {
  sunrise?: string;
  sunset?: string;
};

const toLocalTime = (isoUtc?: string, tz?: string) => {
  if (!isoUtc) return '--:--';
  try {
    const dt = DateTime.fromISO(isoUtc, { zone: 'utc' });
    const local = tz ? dt.setZone(tz) : dt;
    return local.toFormat('h:mm a');
  } catch {
    return '--:--';
  }
};

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

const Almanac: React.FC = () => {
  const { location, serverAvailable } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<SunTimes>({});
  const [tomorrow, setTomorrow] = useState<SunTimes>({});
  const [timeZone, setTimeZone] = useState<string | null>(null);

  const moonPhaseValue = (d: Date) => SunCalc.getMoonIllumination(d).phase;

  const wrapDiff = (a: number, b: number) => {
    const d = Math.abs(a - b);
    return Math.min(d, 1 - d);
  };

  const addMinutes = (d: Date, minutes: number) => {
    const nd = new Date(d.getTime());
    nd.setMinutes(nd.getMinutes() + minutes);
    return nd;
  };

  const searchRange = (start: Date, end: Date, stepMinutes: number, target: number) => {
    let best = new Date(start);
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let t = start.getTime(); t <= end.getTime(); t += stepMinutes * 60 * 1000) {
      const dt = new Date(t);
      const phase = moonPhaseValue(dt);
      const diff = wrapDiff(phase, target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = dt;
      }
    }
    return best;
  };

  const findNextPhaseTime = (start: Date, target: number) => {
    const coarseEnd = addMinutes(start, 32 * 24 * 60);
    const coarse = searchRange(start, coarseEnd, 360, target);
    const fineStart = addMinutes(coarse, -12 * 60);
    const fineEnd = addMinutes(coarse, 12 * 60);
    const fine = searchRange(fineStart, fineEnd, 60, target);
    const finestStart = addMinutes(fine, -3 * 60);
    const finestEnd = addMinutes(fine, 3 * 60);
    const finest = searchRange(finestStart, finestEnd, 5, target);
    return finest;
  };

  useEffect(() => {
    if (!location) {
      setToday({});
      setTomorrow({});
      setTimeZone(null);
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

        try {
          const base = serverAvailable ? 'http://localhost:8080/api' : 'https://api.weather.gov';
          const tzRes = await fetch(`${base}/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
          if (tzRes.ok) {
            const tzJson = await tzRes.json();
            const tz = tzJson?.properties?.timeZone as string | undefined;
            if (tz) setTimeZone(tz);
          }
        } catch {}
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
                  <div className="grid-item time" style={{ gridColumn: 2, gridRow: 2 }}>{toLocalTime(today.sunrise, timeZone ?? undefined)}</div>
                  <div className="grid-item time" style={{ gridColumn: 2, gridRow: 3 }}>{toLocalTime(today.sunset, timeZone ?? undefined)}</div>

                  <div className="grid-item header" style={{ gridColumn: 3, gridRow: 1 }}>Tomorrow</div>
                  <div className="grid-item time" style={{ gridColumn: 3, gridRow: 2 }}>{toLocalTime(tomorrow.sunrise, timeZone ?? undefined)}</div>
                  <div className="grid-item time" style={{ gridColumn: 3, gridRow: 3 }}>{toLocalTime(tomorrow.sunset, timeZone ?? undefined)}</div>
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
                      const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                      return DateTime.fromJSDate(d, { zone: 'utc' }).setZone(tz).toFormat('LLL-dd');
                    };
                    const imgSrc = (file: string) => `/images/icons/moon-phases/${file}`;

                    const results = items.map(item => {
                      const date = findNextPhaseTime(now, item.v) || now;
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