import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

// No image loading required for risk bar computation

const SpcOutlook: React.FC = () => {
  const { location } = useApp();

  // Severity per day on 0–6 scale
  // 0: No prediction, 1: TSTM, 2: MRGL, 3: SLGT, 4: ENH, 5: MDT, 6: HIGH
  const [daySeverity, setDaySeverity] = useState<Array<number | null>>([null, null, null]);
  const overrideActive = useRef(false);
  // Test override: add ?spcTest=tstm,slgt,high or ?spcTest=0,3,6 to preview bar lengths
  const [spcTestRaw, setSpcTestRaw] = useState<string | null>(null);

  useEffect(() => {
    if (overrideActive.current) return;
    if (!location) return;
    const { latitude: lat, longitude: lon } = location;
    const cats = ['TSTM', 'MRGL', 'SLGT', 'ENH', 'MDT', 'HIGH'];
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
    // Map SPC category label to 1–6 scale. Unknown => 0
    const severityScale = (cat: string) => {
      const i = cats.indexOf(normalizeCat(cat));
      return i >= 0 ? i + 1 : 0;
    };
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
      const scale = severityScale(cat);
      if (scale <= 0) return 0;
      const geom = feat.geometry;
      const pt: [number, number] = [lon, lat];
      if (geom?.type === 'Polygon') {
        const ring = geom.coordinates?.[0] as [number, number][];
        if (ring && pointInPoly(pt, ring)) return scale;
      } else if (geom?.type === 'MultiPolygon') {
        const polys = geom.coordinates as [[[number, number][]]];
        for (const poly of polys) {
          const ring = poly[0];
          if (ring && pointInPoly(pt, ring)) return scale;
        }
      }
      return 0;
    };
    const fetchDay = async (day: 1 | 2 | 3) => {
      const url = `https://mesonet.agron.iastate.edu/geojson/spc_outlook.py?day=${day}&cat=categorical`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('bad');
        const gj = await res.json();
        let best = 0;
        for (const f of gj.features || []) {
          const idx = visitFeature(f);
          if (idx > best) best = idx;
        }
        // Always return a number on our 0–6 scale
        return best;
      } catch {
        return 0;
      }
    };
    (async () => {
      const [s1, s2, s3] = await Promise.all([fetchDay(1), fetchDay(2), fetchDay(3)]);
      setDaySeverity([s1, s2, s3]);
    })();
  }, [location, spcTestRaw]);

  const days = useMemo(() => {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const d1 = names[now.getDay()];
    const d2 = names[(now.getDay() + 1) % 7];
    const d3 = names[(now.getDay() + 2) % 7];
    return [d1, d2, d3];
  }, []);

  const parseAndApplySpcTest = () => {
    let raw: string | null = null;
    // Prefer querystring
    const searchParams = new URLSearchParams(window.location.search);
    raw = searchParams.get('spcTest');
    // Hash query support
    if (!raw && window.location.hash) {
      const m = window.location.hash.match(/spcTest=([^&#]+)/i);
      if (m) raw = decodeURIComponent(m[1]);
    }
    // Fallback: scan full href
    if (!raw) {
      const m2 = window.location.href.match(/spcTest=([^&#]+)/i);
      if (m2) raw = decodeURIComponent(m2[1]);
    }
    if (!raw) {
      // No override present: clear any prior test state and allow live fetch
      overrideActive.current = false;
      setSpcTestRaw(null);
      setDaySeverity([null, null, null]);
      return false;
    }
    if (raw.toLowerCase() === 'clear') {
      sessionStorage.removeItem('spcTest');
      localStorage.removeItem('spcTest');
      overrideActive.current = false;
      setSpcTestRaw(null);
      setDaySeverity([null, null, null]);
      return false;
    }
    const cats = ['TSTM', 'MRGL', 'SLGT', 'ENH', 'MDT', 'HIGH'];
    const parseOne = (tok: string): number | null => {
      const t = tok.trim();
      if (!t) return null;
      // numeric
      const num = Number(t);
      if (!Number.isNaN(num) && num >= 0 && num <= 6) return num; // 0..6 scale
      // label
      const lbl = t.toUpperCase();
      const norm = lbl.startsWith('T') ? 'TSTM' : lbl;
      const idx = cats.indexOf(norm);
      return idx >= 0 ? idx + 1 : null; // map to 1..6
    };
    const tokens = raw.replace(/^#\/?/, '').split(/[\,\s]+/);
    let parts = tokens.map(parseOne).filter((x): x is number => x !== null);
    // Fallback: extract any digits 0-6 in order if CSV parsing failed
    if (parts.length === 0) {
      const m = raw.match(/[0-6]/g);
      if (m && m.length) {
        parts = m.map(d => Number(d));
      }
    }
    if (parts.length === 1) parts = [parts[0], parts[0], parts[0]]; // replicate single across 3 days
    if (parts.length === 2) parts = [parts[0], parts[1], parts[1]];
    const over: Array<number | null> = [parts[0] ?? null, parts[1] ?? null, parts[2] ?? null];
    overrideActive.current = true;
    setSpcTestRaw(raw);
    setDaySeverity(over);
    // Do not persist by default to avoid sticky overrides across navigations
    return true;
  };

  useLayoutEffect(() => {
    // Initial parse (immediately and after a tick for router updates)
    let applied = parseAndApplySpcTest();
    const t = window.setTimeout(() => { if (!applied) parseAndApplySpcTest(); }, 0);
    const onHash = () => parseAndApplySpcTest();
    const onPop = () => parseAndApplySpcTest();
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onPop);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  return (
    <>
      <HeaderBar titleLines={["Storm Prediction", "Center Outlook"]} />
      <div className="main spc-outlook">
        <div className="container">
          {/* Left stacked risk labels */}
          <div className="risk-levels">
            {['HIGH', 'MODERATE', 'ENHANCED', 'SLIGHT', 'MARGINAL', 'T\'STORM'].map((r, i) => (
              <div key={i} className="risk-level">{r}</div>
            ))}
          </div>

          {/* Days and gray risk bars based on SPC categorical severity for user's location */}
          <div className="days">
            {days.map((name, idx) => {
              const sev = daySeverity[idx];
              // Map 0..6 severity to calibrated pixel width (existing bar widths)
              // 0: none, 1: TSTM 40, 2: MRGL 60, 3: SLGT 146, 4: ENH 208, 5: MDT 271, 6: HIGH 388
              const scaleToWidth = [0, 40, 60, 146, 208, 271, 388];
              const width = typeof sev === 'number' ? scaleToWidth[Math.max(0, Math.min(6, sev))] : 0;
              return (
                <div className="day" key={idx}>
                  <div className="day-name">{name}</div>
                  {typeof sev === 'number' && sev > 0 && (
                    <div className="risk-bar" style={{ width }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* No explicit error text; quiet failure keeps UI clean */}
          {overrideActive.current && (
            <div style={{ position: 'absolute', right: 8, bottom: 6, fontSize: 10, opacity: 0.6 }}>
              spcTest: {daySeverity.map(v => (v ?? '-')).join(',')} {spcTestRaw ? `(raw: ${spcTestRaw})` : ''}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SpcOutlook;