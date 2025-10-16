import React, { useMemo } from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

const W = 532;
const H = 285;

const HourlyGraph: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();

  const title = 'Hourly Graph';

  const data = useMemo(() => {
    const all = forecastData.hourly || [];
    if (all.length === 0) return null;
    const now = new Date();
    const startHour = new Date(now);
    startHour.setMinutes(0, 0, 0); // current hour
    // find the first period whose startTime >= current hour
    let firstIdx = all.findIndex(h => new Date(h.startTime).getTime() >= startHour.getTime());
    if (firstIdx === -1) firstIdx = 0;
    const hours = all.slice(firstIdx, firstIdx + 24);
    if (hours.length === 0) return null;
    const temps = hours.map(h => h.temperature);
    const minT = Math.min(...temps) - 5;
    const maxT = Math.max(...temps) + 5;
    const rangeT = Math.max(1, maxT - minT);
    const precip = hours.map(h => (h.probabilityOfPrecipitation?.value ?? null));
    // Prefer real cloudCover% from data; fallback to approximation when missing
    const cloud = hours.map(h => {
      if (typeof (h as any).cloudCover === 'number') return (h as any).cloudCover as number;
      const s = (h.shortForecast || '').toLowerCase();
      if (s.includes('clear') || s.includes('sunny') || s.includes('fair')) return 5;
      if (s.includes('partly')) return 40;
      if (s.includes('mostly')) return 70;
      if (s.includes('cloud')) return 90;
      return null;
    });
    return { hours, temps, minT, maxT, rangeT, precip, cloud, startHour } as const;
  }, [forecastData.hourly]);

  const xFor = (i: number, n: number) => (i / Math.max(1, n - 1)) * W;
  const yForTemp = (t: number, minT: number, rangeT: number) => H - ((t - minT) / rangeT) * H;
  const yForPct = (p: number) => H - (p / 100) * H;

  const sixHourLabels = useMemo(() => {
    if (!data) return [] as { x: number; label: string }[];
    const n = data.hours.length;
    const labels: { x: number; label: string }[] = [];
    // Start exactly at current local hour (data.startHour)
    let t = new Date(data.startHour);
    for (let k = 0; k < 5; k++) { // show start, +6h, +12h, +18h, +24h
      const lblH = t.getHours();
      const ampm = lblH >= 12 ? 'P' : 'A';
      const hh = (lblH % 12) || 12;
      const label = `${hh}${ampm}`;
      const hoursFromStart = (t.getTime() - data.startHour.getTime()) / 3600000;
      const idxFloat = Math.min(n - 1, Math.max(0, hoursFromStart));
      const x = xFor(idxFloat, n);
      labels.push({ x, label });
      t = new Date(t.getTime() + 6 * 3600000);
    }
    return labels;
  }, [data]);

  const tempPoints = useMemo(() => {
    if (!data) return '';
    return data.temps.map((t, i) => `${xFor(i, data.hours.length)},${yForTemp(t, data.minT, data.rangeT)}`).join(' ');
  }, [data]);

  const cloudPoints = useMemo(() => {
    if (!data) return '';
    return data.cloud.map((v, i) => {
      const y = typeof v === 'number' ? yForPct(v) : yForPct(0);
      return `${xFor(i, data.hours.length)},${y}`;
    }).join(' ');
  }, [data]);

  const precipPoints = useMemo(() => {
    if (!data) return '';
    return data.precip.map((v, i) => {
      const y = typeof v === 'number' ? yForPct(v) : yForPct(0);
      return `${xFor(i, data.hours.length)},${y}`;
    }).join(' ');
  }, [data]);

  return (
    <div className="display hourly-graph-display" style={{ position: 'relative' }}>
      <HeaderBar titleLines={[title]} />
      <div className="header">
        <div className="right">
          <div className="temperature">TEMPERATURE °F</div>
          <div className="cloud">CLOUD %</div>
          <div className="rain">PRECIP %</div>
        </div>
      </div>
      <div className="main hourly-graph" style={{ marginTop: -90, width: 640, height: 305, position: 'relative', marginLeft: 'auto', marginRight: 'auto' }}>
        {!location && (
          <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Enter a location to view hourly graph</div>
        )}
        {loading && (
          <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Loading hourly graph...</div>
        )}
        {error && (
          <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Error: {error}</div>
        )}
        {data && !loading && (
          <>
            <div className="y-axis">
              <div className="label l-1">{Math.round(data.maxT)}°</div>
              <div className="label l-2">{Math.round((data.maxT + data.minT) / 2)}°</div>
              <div className="label l-3">{Math.round(data.minT)}°</div>
            </div>
            <div className="chart">
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <rect x={0} y={0} width={W} height={H} fill="rgba(10,20,60,0)" />
                {/* Temperature line with shadow */}
                <polyline fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" points={tempPoints} />
                <polyline fill="none" stroke="#ff0000" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" points={tempPoints} />

                {/* Cloud % line with shadow (only if any numeric) */}
                {data.cloud.some(v => typeof v === 'number') && (
                  <>
                    <polyline fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" points={cloudPoints} />
                    <polyline fill="none" stroke="#d3d3d3" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" points={cloudPoints} />
                  </>
                )}

                {/* Precip % line with shadow (only if any numeric) */}
                {data.precip.some(v => typeof v === 'number') && (
                  <>
                    <polyline fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" points={precipPoints} />
                    <polyline fill="none" stroke="#00ffff" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" points={precipPoints} />
                  </>
                )}
              </svg>
            </div>
            <div className="x-axis">
              {sixHourLabels.map((l, idx) => (
                <div key={idx} className={`label l-${idx + 1}`}>{l.label}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HourlyGraph;