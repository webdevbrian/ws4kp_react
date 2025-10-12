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
    const hours = (forecastData.hourly || []).slice(0, 24);
    if (hours.length === 0) return null;
    const temps = hours.map(h => h.temperature);
    const minT = Math.min(...temps) - 5;
    const maxT = Math.max(...temps) + 5;
    const rangeT = Math.max(1, maxT - minT);
    const precip = hours.map(h => (h.probabilityOfPrecipitation?.value ?? null));
    // Prefer real cloudCover% from data; fallback to approximation when missing
    const cloud = hours.map(h => {
      if (typeof h.cloudCover === 'number') return h.cloudCover;
      const s = (h.shortForecast || '').toLowerCase();
      if (s.includes('clear') || s.includes('sunny') || s.includes('fair')) return 5;
      if (s.includes('partly')) return 40;
      if (s.includes('mostly')) return 70;
      if (s.includes('cloud')) return 90;
      return null;
    });
    return { hours, temps, minT, maxT, rangeT, precip, cloud };
  }, [forecastData.hourly]);

  const xFor = (i: number, n: number) => (i / Math.max(1, n - 1)) * W;
  const yForTemp = (t: number, minT: number, rangeT: number) => H - ((t - minT) / rangeT) * H;
  const yForPct = (p: number) => H - (p / 100) * H;

  const sixHourLabels = useMemo(() => {
    if (!data) return [] as { x: number; label: string }[];
    const n = data.hours.length;
    const start = new Date(data.hours[0].startTime);
    const labels: { x: number; label: string }[] = [];
    let t = new Date(start);
    const mod = t.getHours() % 6;
    if (mod !== 0) t.setHours(t.getHours() + (6 - mod));
    for (let k = 0; k < 5; k++) {
      const lblH = t.getHours();
      const ampm = lblH >= 12 ? 'P' : 'A';
      const hh = (lblH % 12) || 12;
      const label = `${hh}${ampm}`;
      const hoursFromStart = (t.getTime() - start.getTime()) / 3600000;
      const idxFloat = Math.min(n - 1, Math.max(0, hoursFromStart));
      const x = xFor(idxFloat, n);
      labels.push({ x, label });
      t = new Date(t.getTime() + 6 * 3600000);
    }
    return labels;
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
                <polyline fill="none" stroke="#ff0000" strokeWidth={3}
                  strokeLinejoin="round" strokeLinecap="round"
                  points={data.temps.map((t, i) => `${xFor(i, data.hours.length)},${yForTemp(t, data.minT, data.rangeT)}`).join(' ')} />
                {data.cloud.some(v => typeof v === 'number') && (
                  <polyline fill="none" stroke="#d3d3d3" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round"
                    points={data.cloud.map((v, i) => {
                      const y = typeof v === 'number' ? yForPct(v) : null;
                      return `${xFor(i, data.hours.length)},${y ?? yForPct(0)}`;
                    }).join(' ')} />
                )}
                {data.precip.some(v => typeof v === 'number') && (
                  <polyline fill="none" stroke="#00ffff" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round"
                    points={data.precip.map((v, i) => {
                      const y = typeof v === 'number' ? yForPct(v) : null;
                      return `${xFor(i, data.hours.length)},${y ?? yForPct(0)}`;
                    }).join(' ')} />
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