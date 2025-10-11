import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

// No image loading required for risk bar computation

const SpcOutlook: React.FC = () => {
  const { location } = useApp();

  // Map a point to categorical severity for day 1-3 using IEM SPC GeoJSON (best-effort)
  const [daySeverity, setDaySeverity] = useState<Array<number | null>>([null, null, null]);

  useEffect(() => {
    if (!location) return;
    const { latitude: lat, longitude: lon } = location;
    const cats = ['TSTM','MRGL','SLGT','ENH','MDT','HIGH'];
    const normalizeCat = (raw: string): string => {
      const s = (raw || '').toString().trim().toUpperCase();
      if (!s) return '';
      if (s.startsWith('T')) return 'TSTM';
      if (s.startsWith('MARG')) return 'MRGL';
      if (s.startsWith('SLGT') || s.startsWith('SLIG')) return 'SLGT';
      if (s.startsWith('ENH')) return 'ENH';
      if (s.startsWith('MDT') || s.startsWith('MOD')) return 'MDT';
      if (s.startsWith('HIGH')) return 'HIGH';
      return s;
    };
    const severityIndex = (cat: string) => cats.indexOf(normalizeCat(cat));
    const pointInPoly = (point: [number, number], polygon: [number, number][]) => {
      // Ray casting
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > point[1]) !== (yj > point[1])) &&
          (point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || 1e-12) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };
    const visitFeature = (feat: any): number => {
      const p = feat.properties || {};
      const cat = (p.category ?? p.outlook ?? p.CAT ?? p.LABEL ?? p.label ?? '').toString();
      const idx = severityIndex(cat);
      if (idx < 0) return -1;
      const geom = feat.geometry;
      const pt: [number, number] = [lon, lat];
      if (geom?.type === 'Polygon') {
        const ring = geom.coordinates?.[0] as [number, number][];
        if (ring && pointInPoly(pt, ring)) return idx;
      } else if (geom?.type === 'MultiPolygon') {
        const polys = geom.coordinates as [ [ [number, number][] ] ];
        for (const poly of polys) {
          const ring = poly[0];
          if (ring && pointInPoly(pt, ring)) return idx;
        }
      }
      return -1;
    };
    const fetchDay = async (day: 1 | 2 | 3) => {
      const url = `https://mesonet.agron.iastate.edu/geojson/spc_outlook.py?day=${day}&cat=categorical`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('bad');
        const gj = await res.json();
        let best = -1;
        for (const f of gj.features || []) {
          const idx = visitFeature(f);
          if (idx > best) best = idx;
        }
        return best >= 0 ? best : null;
      } catch {
        return null;
      }
    };
    (async () => {
      const [s1, s2, s3] = await Promise.all([fetchDay(1), fetchDay(2), fetchDay(3)]);
      setDaySeverity([s1, s2, s3]);
    })();
  }, [location]);

  const days = useMemo(() => {
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const now = new Date();
    const d1 = names[now.getDay()];
    const d2 = names[(now.getDay()+1)%7];
    const d3 = names[(now.getDay()+2)%7];
    return [d1, d2, d3];
  }, []);

  return (
    <>
      <HeaderBar titleLines={["Storm Prediction", "Center Outlook"]} />
      <div className="main spc-outlook">
        <div className="container">
          {/* Left stacked risk labels */}
          <div className="risk-levels">
            {['HIGH','MODERATE','ENHANCED','SLIGHT','MARGINAL','T\'STORM'].map((r, i) => (
              <div key={i} className="risk-level">{r}</div>
            ))}
          </div>

          {/* Days and gray risk bars based on SPC categorical severity for user's location */}
          <div className="days">
            {days.map((name, idx) => {
              const sev = daySeverity[idx];
              const widthFor = (i: number) => {
                // Fixed-width mapping to better match legacy look
                const map = [40, 60, 90, 110, 130, 150]; // TSTM..HIGH
                return map[Math.max(0, Math.min(5, i))];
              };
              const width = typeof sev === 'number' ? widthFor(sev) : undefined;
              return (
                <div className="day" key={idx}>
                  <div className="day-name">{name}</div>
                  {typeof sev === 'number' && <div className="risk-bar" style={{ width }} />}
                </div>
              );
            })}
          </div>

          {/* No explicit error text; quiet failure keeps UI clean */}
        </div>
      </div>
    </>
  );
};

export default SpcOutlook;