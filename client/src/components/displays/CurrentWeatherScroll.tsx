import React, { useEffect, useMemo, useRef } from 'react';
import { useNearbyStations } from '../../hooks/useNearbyStations';
import { useApp } from '../../contexts/AppContext';

const SPEED_PX_PER_SEC = 80; // adjust for readability

const CurrentWeatherScroll: React.FC = () => {
  const { location } = useApp();
  const { stations, loading, error } = useNearbyStations();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const text = useMemo(() => {
    if (!location) return '';
    if (!stations || stations.length === 0) return '';
    const parts = stations.map(s => {
      const obs: string[] = [];
      if (s.temperature !== undefined) obs.push(`${s.temperature}°F`);
      if (s.conditions) obs.push(s.conditions);
      if (s.windDirection && s.windSpeed !== undefined) obs.push(`Wind ${s.windDirection} ${s.windSpeed} mph`);
      if (s.humidity !== undefined) obs.push(`Humidity ${Math.round(s.humidity)}%`);
      return `${s.name}: ${obs.join(' · ')}`;
    });
    return parts.join('   |   ');
  }, [location, stations]);

  useEffect(() => {
    const el = scrollRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    // Cancel any prior loop
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTsRef.current = null;

    const viewportWidth = container.clientWidth || 640;
    const contentWidth = el.scrollWidth;

    // If content fits, pin to start and skip anim
    if (contentWidth <= viewportWidth) {
      el.style.transform = 'translateX(0px)';
      return;
    }

    // Ensure offset is within [ -contentWidth, 0 ) to avoid jump on updates
    if (offsetRef.current <= -contentWidth) offsetRef.current %= contentWidth;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // seconds
      lastTsRef.current = ts;

      offsetRef.current -= SPEED_PX_PER_SEC * dt;
      if (offsetRef.current <= -contentWidth) {
        offsetRef.current += contentWidth; // seamless wrap
      }

      el.style.transform = `translateX(${offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [text]);

  if (!location) return null;

  // Duplicate content for seamless wrap (no gap at the loop)
  const scrollBody = text ? `${text}   |   ${text}` : '';

  return (
    <div className="scroll" style={{ display: text && !loading && !error ? 'block' : 'none' }}>
      <div className="scroll-container" ref={containerRef}>
        <div className="scroll-header">Current Conditions</div>
        <div className="fixed">
          <div className="scroll-area" ref={scrollRef} style={{ willChange: 'transform', position: 'relative' }}>{scrollBody}</div>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherScroll;