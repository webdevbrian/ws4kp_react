import React, { useEffect, useMemo, useRef } from 'react';
import HeaderBar from '../HeaderBar';
import { useApp } from '../../contexts/AppContext';
import { useRegionalObservations } from '../../hooks/useRegionalObservations';

type Region = 'conus' | 'alaska' | 'hawaii';

const RegionalForecast: React.FC = () => {
	const { location } = useApp();
	const { data: obs } = useRegionalObservations();

	const region: Region = useMemo(() => {
		if (!location) return 'conus';
		const { latitude: lat, longitude: lon } = location;
		const inHawaii = lat >= 18 && lat <= 23 && lon <= -154 && lon >= -161;
		const inAlaska = lat >= 50 && lat <= 72 && lon <= -130 && lon >= -170;
		if (inHawaii) return 'hawaii';
		if (inAlaska) return 'alaska';
		return 'conus';
	}, [location]);

	const titleTop = 'Regional';
	const titleBottom = 'Observations';

	const baseMapSrc = useMemo(() => {
		if (region === 'alaska') return '/images/maps/basemap-alaska.webp';
		if (region === 'hawaii') return '/images/maps/basemap-hawaii.webp';
		return '/images/maps/basemap.webp';
	}, [region]);

	const formatCity = (raw: string) => {
		const base = (raw || '').split(',')[0].trim();
		if (!base) return '';
		const tokens = base.split(/\s+/).filter(Boolean);
		const stop = new Set(['of', 'the', 'town', 'city', 'village', 'municipal', 'county']);
		const filtered = tokens.filter(t => !stop.has(t.toLowerCase()));
		const chosen = (filtered.length > 0 ? filtered : tokens).slice(0, 2);
		return chosen.join(' ');
	};

	const getRegionalIcon = (cond?: string) => {
		const c = (cond || '').toLowerCase();
		const base = '/images/icons/regional-maps';
		if (c.includes('thunder')) return `${base}/Thunderstorm.gif`;
		if (c.includes('tstorm')) return `${base}/Thunderstorm.gif`;
		if (c.includes('sleet')) return `${base}/Sleet.gif`;
		if (c.includes('freezing')) return `${base}/Freezing-Rain-1992.gif`;
		if (c.includes('snow')) return `${base}/Light-Snow.gif`;
		if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) return `${base}/Rain-1992.gif`;
		if (c.includes('fog')) return `${base}/Fog.gif`;
		if (c.includes('haze') || c.includes('smoke')) return `${base}/Haze.gif`;
		if (c.includes('wind')) return `${base}/Wind.gif`;
		if (c.includes('mostly cloudy')) return `${base}/Mostly-Cloudy-1994.gif`;
		if (c.includes('partly') && c.includes('cloud')) return `${base}/Partly-Cloudy.gif`;
		if (c.includes('cloud')) return `${base}/Cloudy.gif`;
		if (c.includes('clear') || c.includes('sun') || c.includes('fair')) return `${base}/Sunny.gif`;
		return `${base}/Cloudy.gif`;
	};

	const tilesRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<HTMLDivElement>(null);
	const baseRef = useRef<HTMLImageElement | HTMLDivElement>(null as any);

	// Adjustable overlay nudge to fine-tune alignment against the basemap
	const CITY_OFFSET_X = 0; // px right (+) / left (-)
	const CITY_OFFSET_Y = 0;  // px down (+) / up (-)
	// Adjustable overlay scale around the map center (1 = no change, >1 = overlay appears more zoomed-in)
	const OVERLAY_SCALE = 1.2;

	// Adjustable MAP controls (apply to the basemap itself)
	const MAP_SCALE = 1.3; // multiply the computed regional scale by this
	const MAP_OFFSET_X = 30; // px shift of the basemap after centering
	const MAP_OFFSET_Y = -90; // px shift of the basemap after centering

	// Map-only offset (moves only the basemap image, not the overlay). Units are visual px.
	const MAP_ONLY_OFFSET_X = -80;
	const MAP_ONLY_OFFSET_Y = 30;

	// Adjustable UI sizes for city label, temperature text, and icon
	const CITY_NAME_SIZE = 4; // px
	const TEMP_TEXT_SIZE = 6; // px
	const ICON_W = 7; // px
	const ICON_H = 5; // px

	// Spacing controls
	const CITY_LABEL_MARGIN = 1; // px space below city label
	const ROW_GAP = 2; // px gap between temp and icon

	const applyTransform = () => {
		const tiles = tilesRef.current, view = viewRef.current, base = baseRef.current as any;
		if (!tiles || !view || !base) return;
		const viewW = view.clientWidth || 640, viewH = view.clientHeight || 367;
		const totalW = base.offsetWidth || viewW, totalH = base.offsetHeight || viewH;

		let LON_MIN = -127, LON_MAX = -65; let LAT_MIN = 22, LAT_MAX = 50;
		if (region === 'alaska') { LON_MIN = -170; LON_MAX = -130; LAT_MIN = 52; LAT_MAX = 72; }
		else if (region === 'hawaii') { LON_MIN = -161; LON_MAX = -154; LAT_MIN = 18; LAT_MAX = 23; }

		const lon = location?.longitude ?? -95; const lat = location?.latitude ?? 37;
		const nx = (lon - LON_MIN) / (LON_MAX - LON_MIN); const ny = 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
		const cx = Math.max(0, Math.min(1, nx)) * totalW; const cy = Math.max(0, Math.min(1, ny)) * totalH;

		let targetLonSpan = 8; let targetLatSpan = 5;
		if (region === 'alaska') { targetLonSpan = 12; targetLatSpan = 8; }
		if (region === 'hawaii') { targetLonSpan = 3.5; targetLatSpan = 2.5; }

		const conusLonSpan = (LON_MAX - LON_MIN), conusLatSpan = (LAT_MAX - LAT_MIN);
		const visibleLonAtScale1 = conusLonSpan * (viewW / totalW), visibleLatAtScale1 = conusLatSpan * (viewH / totalH);
		const scaleX = Math.max(1, visibleLonAtScale1 / targetLonSpan), scaleY = Math.max(1, visibleLatAtScale1 / targetLatSpan);
		const scale = Math.min(scaleX, scaleY) * MAP_SCALE;

		let tx = Math.round(viewW / 2 - cx * scale), ty = Math.round(viewH / 2 - cy * scale);
		const minTx = Math.min(0, viewW - totalW * scale), minTy = Math.min(0, viewH - totalH * scale);
		const maxTx = 0, maxTy = 0; tx = Math.max(minTx, Math.min(maxTx, tx)); ty = Math.max(minTy, Math.min(maxTy, ty));
		// Apply manual map-only offsets AFTER clamping so they always take effect
		tx += MAP_OFFSET_X;
		ty += MAP_OFFSET_Y;

		// Apply separate per-image offset so only the basemap moves relative to overlay
		if (base && base.style) {
			const imgShiftX = (MAP_ONLY_OFFSET_X) / scale; // account for tiles scale
			const imgShiftY = (MAP_ONLY_OFFSET_Y) / scale;
			(base as HTMLElement).style.transform = `translate(${imgShiftX}px, ${imgShiftY}px)`;
		}

		tiles.style.transformOrigin = 'top left'; tiles.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
	};

	useEffect(() => {
		const on = () => requestAnimationFrame(applyTransform);
		window.addEventListener('resize', on);
		const img = baseRef.current as unknown as HTMLImageElement | null;
		if (img && img.tagName === 'IMG') {
			if ((img as HTMLImageElement).complete) on();
			else {
				const once = () => { on(); img.removeEventListener('load', once); img.removeEventListener('error', once); };
				img.addEventListener('load', once); img.addEventListener('error', once);
			}
		} else on();
		return () => window.removeEventListener('resize', on);
	}, [region, location, obs.length]);

	const project = (lon: number, lat: number) => {
		let LON_MIN = -127, LON_MAX = -65; let LAT_MIN = 22, LAT_MAX = 50;
		if (region === 'alaska') { LON_MIN = -170; LON_MAX = -130; LAT_MIN = 52; LAT_MAX = 72; }
		else if (region === 'hawaii') { LON_MIN = -161; LON_MAX = -154; LAT_MIN = 18; LAT_MAX = 23; }
		const totalW = (baseRef.current as any)?.offsetWidth || 640, totalH = (baseRef.current as any)?.offsetHeight || 367;
		const nx = (lon - LON_MIN) / (LON_MAX - LON_MIN), ny = 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
		return { x: nx * totalW, y: ny * totalH };
	};

	// Current center in pixel space (same math as applyTransform)
	const centerPx = useMemo(() => {
		const base = baseRef.current as any;
		const totalW = base?.offsetWidth || 640; const totalH = base?.offsetHeight || 367;
		let LON_MIN = -127, LON_MAX = -65; let LAT_MIN = 22, LAT_MAX = 50;
		if (region === 'alaska') { LON_MIN = -170; LON_MAX = -130; LAT_MIN = 52; LAT_MAX = 72; }
		else if (region === 'hawaii') { LON_MIN = -161; LON_MAX = -154; LAT_MIN = 18; LAT_MAX = 23; }
		const lon = location?.longitude ?? -95; const lat = location?.latitude ?? 37;
		const nx = (lon - LON_MIN) / (LON_MAX - LON_MIN); const ny = 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);
		return { cx: Math.max(0, Math.min(1, nx)) * totalW, cy: Math.max(0, Math.min(1, ny)) * totalH };
	}, [region, location]);

	const majorObs = useMemo(() => {
		const seen = new Set<string>(); const list: typeof obs = [] as any;
		for (const s of obs) {
			if (typeof s.lat !== 'number' || typeof s.lon !== 'number') continue;
			const key = `${Math.round(s.lat * 20) / 20}_${Math.round(s.lon * 20) / 20}`; // ~0.05° grid
			if (seen.has(key)) continue; seen.add(key);
			list.push(s); if (list.length >= 12) break;
		}
		return list;
	}, [obs]);

	// Collision thresholds (in pixels) for skipping overlapping blocks
	const COLLIDE_DX = 10; // horizontal proximity threshold
	const COLLIDE_DY = 8; // vertical proximity threshold

	return (
		<div className="display regional-forecast-display">
			<HeaderBar titleLines={[titleTop, titleBottom]} />
			<div className="main regional" ref={viewRef}>
				<div className="container">
					<div className="tiles" style={{ position: 'relative' }} ref={tilesRef}>
						<img src={baseMapSrc} alt="basemap" ref={baseRef as any} style={{ display: 'block', width: '100%', height: '100%' }} />
						<div className="obs-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
							{(() => {
								const placed: { x: number; y: number }[] = [];
								return majorObs.map((s: ReturnType<typeof useRegionalObservations>['data'][number]) => {
									if (typeof s.lat !== 'number' || typeof s.lon !== 'number') return null;
									const p0 = project(s.lon, s.lat);
									// Scale marker position around the map center to adjust perceived overlay zoom
									const p = {
										x: centerPx.cx + (p0.x - centerPx.cx) * OVERLAY_SCALE,
										y: centerPx.cy + (p0.y - centerPx.cy) * OVERLAY_SCALE,
									};
									// Simple collision rejection against already placed blocks
									for (const q of placed) {
										if (Math.abs(p.x - q.x) < COLLIDE_DX && Math.abs(p.y - q.y) < COLLIDE_DY) {
											return null; // skip this one
										}
									}
									placed.push({ x: p.x, y: p.y });
									const icon = getRegionalIcon(s.conditions);
									return (
										<div key={s.id} style={{ position: 'absolute', transform: `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)` }}>
											<div style={{ transform: `translate(${CITY_OFFSET_X}px, ${CITY_OFFSET_Y}px)` }}>
												<div style={{ color: 'white', fontFamily: 'Star4000 Small', fontSize: CITY_NAME_SIZE, lineHeight: 1, textShadow: '1px 1px 0 #000', marginBottom: CITY_LABEL_MARGIN }}>{formatCity(s.name)}</div>
												<div style={{ display: 'flex', alignItems: 'center', gap: ROW_GAP, marginTop: 0 }}>
													{typeof s.tempF === 'number' && (
														<div style={{ color: 'yellow', fontFamily: 'Star4000', fontSize: TEMP_TEXT_SIZE, lineHeight: 1, textShadow: '1px 1px 0 #000' }}>{s.tempF}</div>
													)}
													<img src={icon} alt={s.conditions || 'obs'} style={{ width: ICON_W, height: ICON_H, imageRendering: 'pixelated' }} />
												</div>
											</div>
										</div>
									);
								});
							})()}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RegionalForecast;