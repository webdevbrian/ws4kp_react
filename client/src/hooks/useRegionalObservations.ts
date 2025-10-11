import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

export type RegionalObs = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tempF?: number;
  conditions?: string;
};

const toF = (c?: number | null) => (typeof c === 'number' ? Math.round(c * 9 / 5 + 32) : undefined);

export const useRegionalObservations = () => {
  const { location } = useApp();
  const [data, setData] = useState<RegionalObs[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) { setData([]); return; }
    let cancelled = false;

    const run = async () => {
      setLoading(true); setError(null);
      try {
        const baseUrl = 'http://localhost:8080';
        const lat = location.latitude;
        const lon = location.longitude;

        // Primary: get stations by bbox around the user
        const south = (lat - 5).toFixed(3);
        const north = (lat + 5).toFixed(3);
        const west = (lon - 6).toFixed(3);
        const east = (lon + 6).toFixed(3);
        let feats: any[] = [];
        try {
          const bboxRes = await fetch(`${baseUrl}/api/stations?bbox=${west},${south},${east},${north}`);
          if (bboxRes.ok) {
            const gj = await bboxRes.json();
            feats = gj.features || [];
          }
        } catch {}

        // Fallback: NWS points->observationStations
        if (!feats || feats.length === 0) {
          const plat = lat.toFixed(4);
          const plon = lon.toFixed(4);
          const pointUrl = `${baseUrl}/api/points/${plat},${plon}`;
          const pointRes = await fetch(pointUrl);
          if (!pointRes.ok) throw new Error('point');
          const pointData = await pointRes.json();
          const stationsUrl: string = pointData.properties.observationStations;
          const stationsApiUrl = stationsUrl.replace('https://api.weather.gov', '/api');
          const stationsRes = await fetch(`${baseUrl}${stationsApiUrl}`);
          if (!stationsRes.ok) throw new Error('stations');
          const stationsData = await stationsRes.json();
          feats = stationsData.features || [];
        }

        const take = Math.min(40, feats.length);
        const seen = new Set<string>();
        const out: RegionalObs[] = [];

        await Promise.all(
          feats.slice(0, take).map(async (f) => {
            const p = f.properties || {};
            const g = f.geometry || {};
            if (!g || g.type !== 'Point') return;
            const coords = (g.coordinates as [number, number]) || [undefined, undefined];
            const id: string = p.stationIdentifier;
            if (!id || seen.has(id)) return;
            seen.add(id);
            try {
              const o = await fetch(`${baseUrl}/api/stations/${id}/observations/latest`);
              if (!o.ok) return;
              const j = await o.json();
              const props = j.properties || {};
              out.push({
                id,
                name: p.name || id,
                lon: coords[0],
                lat: coords[1],
                tempF: toF(props.temperature?.value ?? null),
                conditions: props.textDescription || undefined,
              });
            } catch {}
          })
        );

        out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (!cancelled) setData(out);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [location]);

  return { data, loading, error };
};
