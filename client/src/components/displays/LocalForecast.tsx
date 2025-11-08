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
  const animationRef = useRef<number | null>(null);
  const scrollPositionRef = useRef<number>(0);

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

  // Auto-scroll logic
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content || !paragraph) return;

    let scrollTimeout: NodeJS.Timeout;
    let pauseAtBottomTimeout: NodeJS.Timeout;
    let pauseAtTopTimeout: NodeJS.Timeout;
    let lastTimestamp: number | null = null;

    const SCROLL_SPEED = 30; // pixels per second
    const INITIAL_DELAY = 2000; // 2 seconds
    const BOTTOM_PAUSE = 10000; // 10 seconds
    const TOP_PAUSE = 2000; // 2 seconds

    const startScrolling = () => {
      const containerHeight = container.offsetHeight;
      const contentHeight = content.offsetHeight;
      const scrollDistance = contentHeight - containerHeight;

      // Only scroll if content overflows
      if (scrollDistance <= 0) {
        return;
      }

      scrollPositionRef.current = 0;

      const animate = (timestamp: number) => {
        if (!lastTimestamp) lastTimestamp = timestamp;

        const elapsed = timestamp - lastTimestamp;
        const distance = (SCROLL_SPEED * elapsed) / 1000;

        scrollPositionRef.current = Math.min(scrollPositionRef.current + distance, scrollDistance);
        content.style.transform = `translateY(-${scrollPositionRef.current}px)`;

        lastTimestamp = timestamp;

        if (scrollPositionRef.current >= scrollDistance) {
          // Reached bottom - pause for 10 seconds
          pauseAtBottomTimeout = setTimeout(() => {
            // Reset to top
            scrollPositionRef.current = 0;
            content.style.transform = 'translateY(0)';
            lastTimestamp = null;

            // Pause at top for 2 seconds then restart
            pauseAtTopTimeout = setTimeout(() => {
              startScrolling();
            }, TOP_PAUSE);
          }, BOTTOM_PAUSE);
        } else {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial delay before starting
    scrollTimeout = setTimeout(() => {
      startScrolling();
    }, INITIAL_DELAY);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(pauseAtBottomTimeout);
      clearTimeout(pauseAtTopTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      scrollPositionRef.current = 0;
      if (content) {
        content.style.transform = 'translateY(0)';
      }
    };
  }, [paragraph]);

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