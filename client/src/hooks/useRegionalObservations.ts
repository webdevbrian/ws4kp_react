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

        // Prefer Weather.gov station list near user's point; fallback to static if needed
        let feats: any[] = [];
        try {
          const plat = lat.toFixed(4);
          const plon = lon.toFixed(4);
          const pointUrl = `${baseUrl}/api/points/${plat},${plon}`;
          const pointData = await cachedJson<any>(pointUrl, 30 * 60 * 1000);
          const stationsUrl: string = pointData.properties.observationStations;
          const stationsApiUrl = stationsUrl.replace('https://api.weather.gov', '/api');
          const stationsData = await cachedJson<any>(`${baseUrl}${stationsApiUrl}`, 30 * 60 * 1000);
          const raw = stationsData.features || [];
          feats = raw.filter((f: any) => {
            const okGeom = f?.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates);
            const id = f?.properties?.stationIdentifier || '';
            const okId = typeof id === 'string' && /^[A-Z]{4}$/.test(id);
            return okGeom && okId;
          });
        } catch {
          const stationsMap = await cachedJson<any>(`${baseUrl}/data/stations.json`, 30 * 60 * 1000);
          const entries = Object.values(stationsMap || {}) as Array<{ id: string; city: string; lat: number; lon: number }>;
          feats = entries
            .filter((e) => typeof e.lat === 'number' && typeof e.lon === 'number')
            .map((e) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
              properties: { stationIdentifier: e.id, name: e.city },
            }));
        }

        // Compute distance to user and sort by proximity
        const toRad = (deg: number) => deg * Math.PI / 180;
        const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371; // km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        const withDist = feats.map((f: any) => {
          const coords = f.geometry.coordinates as [number, number];
          const dkm = haversineKm(lat, lon, coords[1], coords[0]);
          const dLat = coords[1] - lat;
          const dLon = coords[0] - lon;
          let ang = Math.atan2(dLat, dLon) * 180 / Math.PI; // -180..180
          if (ang < 0) ang += 360; // 0..360
          return { f, dkm, ang };
        });

        // Bin by angle sector and select round-robin to spread points around the map
        const SECTORS = 16;
        const sectorSize = 360 / SECTORS;
        const bins: Array<typeof withDist> = Array.from({ length: SECTORS }, () => [] as any);
        withDist.forEach((e) => {
          const idx = Math.min(SECTORS - 1, Math.floor(e.ang / sectorSize));
          bins[idx].push(e);
        });
        bins.forEach(bin => bin.sort((a, b) => a.dkm - b.dkm));

        const selected: any[] = [];
        const cap = Math.min(120, withDist.length);
        let added = 0; let round = 0;
        while (added < cap) {
          let progressed = false;
          for (let i = 0; i < SECTORS; i += 1) {
            const bin = bins[i];
            if (bin[round]) {
              selected.push(bin[round]);
              added += 1; progressed = true;
              if (added >= cap) break;
            }
          }
          if (!progressed) break; // all bins exhausted
          round += 1;
        }

        const nearest = selected.map(x => x.f);
        const seen = new Set<string>();
        const out: RegionalObs[] = [];

        await Promise.all(
          nearest.map(async (f) => {
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

        // If we still have too few points (e.g., obs unavailable), add placeholders
        if (out.length < 12) {
          const have = new Set(out.map(o => o.id));
          for (const f of nearest) {
            const p = f.properties || {};
            const id: string = p.stationIdentifier;
            if (!id || have.has(id)) continue;
            const g = f.geometry || {};
            if (!g || g.type !== 'Point') continue;
            const coords = (g.coordinates as [number, number]) || [undefined, undefined];
            out.push({
              id,
              name: p.name || id,
              lon: coords[0],
              lat: coords[1],
            });
            have.add(id);
            if (out.length >= 12) break;
          }
        }

        // Keep 'out' in distributed order to lower collision rejections in overlay
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
