import React, { useEffect, useMemo, useRef } from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useApp } from '../../contexts/AppContext';
import { useNavigation } from '../../contexts/NavigationContext';
import HeaderBar from '../HeaderBar';

const LocalForecast: React.FC = () => {
  const { location } = useApp();
  const { currentDisplay } = useNavigation();
  const { forecastData, loading, error } = useForecastData();
  useWeatherData(); // ensure current data is fetched elsewhere; not used here

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isVisible = currentDisplay === 'local-forecast';

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
    // Reset position immediately when component becomes visible or paragraph changes
    if (contentRef.current) {
      contentRef.current.style.transform = 'translateY(0)';
      scrollPositionRef.current = 0;
    }

    // Only start scrolling if the view is visible
    if (!isVisible) return;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content || !paragraph) return;

    let scrollTimeout: NodeJS.Timeout;
    let pauseAtBottomTimeout: NodeJS.Timeout;
    let pauseAtTopTimeout: NodeJS.Timeout;
    let animationId: number | null = null;
    let lastTimestamp: number | null = null;
    let isActive = true;

    const SCROLL_SPEED = 30; // pixels per second
    const INITIAL_DELAY = 2000; // 2 seconds
    const BOTTOM_PAUSE = 10000; // 10 seconds
    const TOP_PAUSE = 2000; // 2 seconds

    const startScrolling = () => {
      if (!isActive) return;

      // Force layout recalculation to get accurate measurements
      const containerHeight = container.getBoundingClientRect().height;
      const contentHeight = content.scrollHeight;
      const scrollDistance = contentHeight - containerHeight;

      // Only scroll if content overflows
      if (scrollDistance <= 0) {
        return;
      }

      scrollPositionRef.current = 0;
      lastTimestamp = null;

      const animate = (timestamp: number) => {
        if (!isActive) return;

        if (!lastTimestamp) lastTimestamp = timestamp;

        const elapsed = timestamp - lastTimestamp;
        const distance = (SCROLL_SPEED * elapsed) / 1000;

        scrollPositionRef.current = Math.min(scrollPositionRef.current + distance, scrollDistance);

        if (content && isActive) {
          content.style.transform = `translateY(-${scrollPositionRef.current}px)`;
        }

        lastTimestamp = timestamp;

        if (scrollPositionRef.current >= scrollDistance) {
          // Reached bottom - pause for 10 seconds
          pauseAtBottomTimeout = setTimeout(() => {
            if (!isActive) return;

            // Reset to top
            scrollPositionRef.current = 0;
            if (content) {
              content.style.transform = 'translateY(0)';
            }
            lastTimestamp = null;

            // Pause at top for 2 seconds then restart
            pauseAtTopTimeout = setTimeout(() => {
              if (isActive) {
                startScrolling();
              }
            }, TOP_PAUSE);
          }, BOTTOM_PAUSE);
        } else {
          if (isActive) {
            animationId = requestAnimationFrame(animate);
          }
        }
      };

      animationId = requestAnimationFrame(animate);
    };

    // Use a small delay to ensure DOM is fully rendered
    const initTimeout = setTimeout(() => {
      // Initial delay before starting
      scrollTimeout = setTimeout(() => {
        if (isActive) {
          startScrolling();
        }
      }, INITIAL_DELAY);
    }, 100);

    return () => {
      isActive = false;
      clearTimeout(initTimeout);
      clearTimeout(scrollTimeout);
      clearTimeout(pauseAtBottomTimeout);
      clearTimeout(pauseAtTopTimeout);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      scrollPositionRef.current = 0;
      if (content) {
        content.style.transform = 'translateY(0)';
      }
    };
  }, [paragraph, isVisible]);

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