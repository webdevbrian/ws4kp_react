import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNearbyStations } from '../../hooks/useNearbyStations';
import { useApp } from '../../contexts/AppContext';

const SPEED_PX_PER_SEC = 80; // adjust for readability

const CurrentWeatherScroll: React.FC = () => {
  const { location } = useApp();
  const { stations, loading, error } = useNearbyStations();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [animKey, setAnimKey] = useState(0);

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

    // Reset position instantly (no transition) before measuring
    el.style.transition = 'none';
    el.style.left = '0px';

    const start = () => {
      const contentWidth = el.scrollWidth;
      const viewportWidth = container.clientWidth || 640;

      if (contentWidth <= viewportWidth) {
        // No need to scroll; ensure static
        el.style.transition = 'none';
        el.style.left = '0px';
        return;
      }

      // Distance to travel is negative delta from 0 to (viewport - content)
      const distance = viewportWidth - contentWidth; // negative value
      const durationSec = Math.abs(distance) / SPEED_PX_PER_SEC;

      // Start animation on next tick to allow style reset to apply
      requestAnimationFrame(() => {
        el.style.transition = `left ${durationSec}s linear`;
        el.style.left = `${distance}px`;
      });

      // When finished, restart after a short pause
      const timer = window.setTimeout(() => {
        // Trigger re-run by changing key
        setAnimKey(k => k + 1);
      }, (durationSec + 1) * 1000);

      return () => window.clearTimeout(timer);
    };

    const cleanup = start();
    return () => {
      if (cleanup) cleanup();
    };
  }, [text, animKey]);

  if (!location) return null;

  return (
    <div className="scroll" style={{ display: text && !loading && !error ? 'block' : 'none' }}>
      <div className="scroll-container" ref={containerRef}>
        <div className="scroll-header">Current Conditions</div>
        <div className="fixed">
          <div className="scroll-area" ref={scrollRef}>{text}</div>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherScroll;