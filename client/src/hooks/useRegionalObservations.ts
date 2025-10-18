import { useEffect, useState } from 'react';
import { cachedJson } from '../utils/cachedFetch';
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

        // Use static stations list to avoid bbox and reduce external calls
        const stationsList = await cachedJson<any>(`${baseUrl}/data/stations.json`, 30 * 60 * 1000);
        const feats: any[] = stationsList.features || [];

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
              const j = await cachedJson<any>(`${baseUrl}/api/stations/${id}/observations/latest`, 30 * 60 * 1000).catch(() => null);
              if (!j) return;
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
    // Refresh every 30 minutes
    const interval = setInterval(run, 30 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [location]);

  return { data, loading, error };
};
