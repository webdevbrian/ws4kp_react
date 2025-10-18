import React, { useEffect, useMemo, useRef } from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

const LocalForecast: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();
  useWeatherData(); // ensure current data is fetched elsewhere; not used here

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const RAF = useRef<number | null>(null);
  const state = useRef<'idle' | 'scrolling' | 'pause-bottom'>('idle');
  const lastTs = useRef<number | null>(null);
  const yRef = useRef<number>(0);

  const toCardinal = (dir?: string) => {
    const d = (dir || '').toUpperCase();
    const map: Record<string, string> = { N: 'NORTH', S: 'SOUTH', E: 'EAST', W: 'WEST' };
    if (map[d]) return map[d];
    return d; // keep NE/NNW, etc.
  };

  const up = (s: string) => (s || '').toUpperCase();

  const normalizeWindSpeed = (ws?: string) => {
    if (!ws) return '';
    return ws.toUpperCase().replace(/\s*-\s*/g, ' TO ');
  };

  const makeSentence = (p: any) => {
    if (!p) return '';
    const name = up(p.name || '');
    const isLow = !p.isDaytime || /NIGHT/i.test(p.name || '');
    const hiLo = isLow ? 'LOW' : 'HIGH';
    const temp = `${Math.round(p.temperature)}°${p.temperatureUnit || ''}`.replace('°F', '');
    const wx = up(p.shortForecast || '');
    const dir = toCardinal(p.windDirection);
    const ws = normalizeWindSpeed(p.windSpeed);
    const wind = ws ? `${dir ? dir + ' ' : ''}WIND ${ws}.` : '';
    return `${name}...${wx}, ${hiLo} AROUND ${temp}. ${wind}`.trim();
  };

  const sentences = useMemo(() => {
    const d = forecastData.daily || [];
    return d.slice(0, 4).map(makeSentence).filter(Boolean);
  }, [forecastData.daily]);

  const paragraph = useMemo(() => sentences.join(' '), [sentences]);

  // Auto-scroll logic (translateY)
  useEffect(() => {
    const el = containerRef.current; const inner = contentRef.current;
    if (!el || !inner) return;
    let startTimer: any; let pauseTimer: any;
    const SPEED_PX_PER_SEC = 12; // slow, readable

    // Ensure initial transform
    inner.style.willChange = 'transform';
    inner.style.transform = 'translateY(0px)';

    const STEP = (ts: number) => {
      if (!el || !inner) return;
      if (state.current !== 'scrolling') { RAF.current = requestAnimationFrame(STEP); return; }
      const max = Math.max(0, inner.scrollHeight - el.clientHeight);
      if (max <= 0) { // No scrolling needed
        state.current = 'idle';
        return;
      }
      const prev = lastTs.current ?? ts;
      const dt = Math.max(0, ts - prev) / 1000; // seconds
      lastTs.current = ts;
      const delta = SPEED_PX_PER_SEC * dt;
      const next = yRef.current + delta;
      if (next >= max) {
        yRef.current = max;
        inner.style.transform = `translateY(${-yRef.current}px)`;
        state.current = 'pause-bottom';
        pauseTimer = setTimeout(() => {
          yRef.current = 0;
          inner.style.transform = 'translateY(0px)';
          lastTs.current = null;
          // Wait 2s after resetting to the top before resuming
          state.current = 'idle';
          startTimer = setTimeout(() => { state.current = 'scrolling'; }, 2000);
        }, 10000);
      } else {
        yRef.current = next;
        inner.style.transform = `translateY(${-yRef.current}px)`;
      }
      RAF.current = requestAnimationFrame(STEP);
    };
    startTimer = setTimeout(() => {
      lastTs.current = null;
      state.current = 'scrolling';
      RAF.current = requestAnimationFrame(STEP);
    }, 2000);
    return () => {
      if (RAF.current) cancelAnimationFrame(RAF.current);
      clearTimeout(startTimer); clearTimeout(pauseTimer);
      state.current = 'idle';
    };
  }, [sentences.length]);

  return (
    <div className="display local-forecast-display">
      <HeaderBar titleLines={["Local", "Forecast"]} />
      <div className="main local-forecast">
        {!location && <p>Please enter a location</p>}
        {loading && <p>Loading forecast...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && !error && location && (
          <div className="container" ref={containerRef}>
            <div className="forecasts" ref={contentRef}>
              <div className="forecast">{paragraph}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalForecast;