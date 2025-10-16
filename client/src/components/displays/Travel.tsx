import React, { useEffect, useRef } from 'react';
import { useTravelCities } from '../../hooks/useTravelCities';
import { useTravelWeatherData } from '../../hooks/useTravelWeatherData';
import { getWeatherIconPath } from '../../utils/weatherIcons';
import HeaderBar from '../HeaderBar';

const Travel: React.FC = () => {
  const { cities, loading: citiesLoading, error: citiesError } = useTravelCities();
  const { weatherData, loading: weatherLoading, error: weatherError } = useTravelWeatherData(cities);

  const isLoading = citiesLoading || weatherLoading;
  const error = citiesError || weatherError;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const RAF = useRef<number | null>(null);
  const state = useRef<'idle' | 'scrolling' | 'pause-bottom'>('idle');
  const lastTs = useRef<number | null>(null);
  const yRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current; const inner = contentRef.current;
    if (!el || !inner) return;
    if (isLoading || error) return;
    let startTimer: any; let pauseTimer: any;
    const SPEED_PX_PER_SEC = 12;
    inner.style.willChange = 'transform';
    inner.style.transform = 'translateY(0px)';

    const STEP = (ts: number) => {
      if (!el || !inner) return;
      if (state.current !== 'scrolling') { RAF.current = requestAnimationFrame(STEP); return; }
      const max = Math.max(0, inner.scrollHeight - el.clientHeight);
      if (max <= 0) { state.current = 'idle'; return; }
      const prev = lastTs.current ?? ts;
      const dt = Math.max(0, ts - prev) / 1000;
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
  }, [weatherData.length, isLoading, error]);

  return (
    <div className="display travel-display">
      <HeaderBar titleLines={["Travel"]} />
      <div className="main travel">
        <div className="column-headers">
          <div className="temp low">LOW</div>
          <div className="temp high">HIGH</div>
        </div>
        <div className="travel-lines" ref={containerRef}>
          <div className="travel-content" ref={contentRef}>
            {isLoading && (
              <div className="travel-row">
                <div className="city">Loading travel cities...</div>
              </div>
            )}
            {error && (
              <div className="travel-row">
                <div className="city">Error: {error}</div>
              </div>
            )}
            {!isLoading && !error && weatherData.map((cityWeather, index) => (
              <div key={index} className="travel-row">
                <div className="city">{cityWeather.city}</div>
                {cityWeather.error ? (
                  <div className="temp high" style={{ left: '400px' }}>{cityWeather.error}</div>
                ) : (
                  <>
                    <div className="icon">
                      {(cityWeather.conditions || cityWeather.icon) && (
                        <img
                          src={getWeatherIconPath(cityWeather.conditions, cityWeather.icon)}
                          alt={cityWeather.conditions || 'Weather'}
                        />
                      )}
                    </div>
                    <div className="temp low">
                      {cityWeather.low !== undefined ? `${cityWeather.low}°` : '--'}
                    </div>
                    <div className="temp high">
                      {cityWeather.high !== undefined ? `${cityWeather.high}°` : '--'}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Travel;