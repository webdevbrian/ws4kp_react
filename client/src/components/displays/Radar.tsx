import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const Radar: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '');

  const { location } = useApp();

  const region: 'hawaii' | 'alaska' | 'conus' = useMemo(() => {
    if (!location) return 'conus';
    const { latitude: lat, longitude: lon } = location;
    // Rough bounds for HI and AK; fallback to CONUS tiles otherwise
    const inHawaii = lat >= 18 && lat <= 23 && lon <= -154 && lon >= -161;
    const inAlaska = lat >= 50 && lat <= 72 && lon <= -130 && lon >= -170;
    if (inHawaii) return 'hawaii';
    if (inAlaska) return 'alaska';
    return 'conus';
  }, [location]);

  const rows = 11; // per radarnotes: cropped into 10x11 (cols x rows)
  const cols = 10;

  // Refs for positioning
  const tilesRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const baseGridRef = useRef<HTMLDivElement>(null);
  const overlayGridRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLDivElement>(null);

  // Build Mesonet frame URLs for the last N 5-minute intervals and load those that exist
  const [frameUrls, setFrameUrls] = useState<string[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const buildUrls = () => {
      const urls: string[] = [];
      const nowUtc = new Date();
      // Round down to nearest 5 minutes UTC
      const ms = nowUtc.getTime();
      const fiveMin = 5 * 60 * 1000;
      const aligned = new Date(Math.floor(ms / fiveMin) * fiveMin);
      const framesToTry = 12; // last hour
      for (let i = 0; i < framesToTry; i++) {
        const dt = new Date(aligned.getTime() - i * fiveMin);
        const yyyy = dt.getUTCFullYear();
        const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        const HH = String(dt.getUTCHours()).padStart(2, '0');
        const MM = String(dt.getUTCMinutes()).padStart(2, '0');
        // Add a cache-busting query to avoid stale 304s from some CDNs while still leveraging browser cache per unique URL
        const ver = aligned.getTime();
        const url = `https://mesonet.agron.iastate.edu/archive/data/${yyyy}/${mm}/${dd}/GIS/uscomp/n0r_${yyyy}${mm}${dd}${HH}${MM}.png?v=${ver}`;
        urls.push(url);
      }
      return urls;
    };

    const tryLoad = async (urls: string[]) => {
      const ok: string[] = [];
      await Promise.all(
        urls.map(
          (u) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                ok.push(u);
                resolve();
              };
              img.onerror = () => resolve();
              img.crossOrigin = 'anonymous';
              img.src = u;
            })
        )
      );
      if (!cancelled) {
        ok.sort(); // chronological ascending
        setFrameUrls(ok);
        setFrameIndex(0);
      }
    };

    const urls = buildUrls();
    tryLoad(urls);

    const t = setInterval(() => {
      const urls = buildUrls();
      tryLoad(urls);
    }, 5 * 60 * 1000); // refresh every 5 minutes

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Simple animation through loaded frames
  useEffect(() => {
    if (frameUrls.length === 0) return;
    const t = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frameUrls.length);
    }, 400);
    return () => clearInterval(t);
  }, [frameUrls]);

  // Center and zoom on user location for all regions by translating and scaling the tiles
  useEffect(() => {
    const tiles = tilesRef.current;
    const view = viewRef.current;
    const base = baseGridRef.current;
    if (!tiles || !view || !base) return;

    const apply = () => {
      const viewW = view.clientWidth || 640;
      const viewH = view.clientHeight || 367;
      // Size the mosaic by measuring the basemap element (grid or stretched image)
      const totalW = base.offsetWidth;
      const totalH = base.offsetHeight;
      if (!totalW || !totalH) return;

      // Region-specific geographic bounds (lon west negative)
      let LON_MIN = -127, LON_MAX = -65;
      let LAT_MIN = 22, LAT_MAX = 50; // CONUS tuned for better FL coverage
      if (region === 'alaska') {
        LON_MIN = -170; LON_MAX = -130;
        LAT_MIN = 52; LAT_MAX = 72;
      } else if (region === 'hawaii') {
        LON_MIN = -161; LON_MAX = -154;
        LAT_MIN = 18; LAT_MAX = 23;
      }
      const lon = location?.longitude ?? -95;
      const lat = location?.latitude ?? 37;

      const nx = (lon - LON_MIN) / (LON_MAX - LON_MIN);
      const ny = 1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN); // invert y
      const cx = Math.max(0, Math.min(1, nx)) * totalW;
      const cy = Math.max(0, Math.min(1, ny)) * totalH;

      // Compute dynamic zoom so a target geographic span fits the viewport (per-region)
      let targetLonSpan = 4; // default CONUS tighter zoom
      let targetLatSpan = 2.5;
      if (region === 'alaska') {
        targetLonSpan = 6; targetLatSpan = 3.5;
      } else if (region === 'hawaii') {
        targetLonSpan = 2; targetLatSpan = 1.5;
      }
      const conusLonSpan = (LON_MAX - LON_MIN);
      const conusLatSpan = (LAT_MAX - LAT_MIN);
      const visibleLonAtScale1 = conusLonSpan * (viewW / totalW);
      const visibleLatAtScale1 = conusLatSpan * (viewH / totalH);
      const scaleX = Math.max(1, visibleLonAtScale1 / targetLonSpan);
      const scaleY = Math.max(1, visibleLatAtScale1 / targetLatSpan);
      const scale = Math.min(scaleX, scaleY);

      // Translate so that (cx, cy) lands at the viewport center after scaling
      let tx = Math.round(viewW / 2 - cx * scale);
      let ty = Math.round(viewH / 2 - cy * scale);

      // Clamp so the mosaic still covers the viewport
      const minTx = Math.min(0, viewW - totalW * scale);
      const minTy = Math.min(0, viewH - totalH * scale);
      const maxTx = 0;
      const maxTy = 0;
      tx = Math.max(minTx, Math.min(maxTx, tx));
      ty = Math.max(minTy, Math.min(maxTy, ty));
      tiles.style.transformOrigin = 'top left';
      tiles.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    };

    // Ensure images are loaded before measuring
    const imgs = Array.from(tiles.querySelectorAll('img')) as HTMLImageElement[];
    const unloaded = imgs.filter(img => !img.complete);
    if (unloaded.length === 0) {
      // Ensure overlay matches basemap dimensions
      if (baseGridRef.current) {
        const w = `${baseGridRef.current.offsetWidth}px`;
        const h = `${baseGridRef.current.offsetHeight}px`;
        if (overlayGridRef.current) {
          overlayGridRef.current.style.width = w;
          overlayGridRef.current.style.height = h;
        }
        if (framesRef.current) {
          framesRef.current.style.width = w;
          framesRef.current.style.height = h;
        }
      }
      // Defer to next frame so DOM has applied sizes
      requestAnimationFrame(apply);
    } else {
      let remaining = unloaded.length;
      const onLoadOrError = () => {
        remaining -= 1;
        if (remaining <= 0) {
          if (baseGridRef.current) {
            const w = `${baseGridRef.current.offsetWidth}px`;
            const h = `${baseGridRef.current.offsetHeight}px`;
            if (overlayGridRef.current) {
              overlayGridRef.current.style.width = w;
              overlayGridRef.current.style.height = h;
            }
            if (framesRef.current) {
              framesRef.current.style.width = w;
              framesRef.current.style.height = h;
            }
          }
          requestAnimationFrame(apply);
        }
      };
      unloaded.forEach(img => {
        img.addEventListener('load', onLoadOrError, { once: true });
        img.addEventListener('error', onLoadOrError, { once: true });
      });
    }

    window.addEventListener('resize', apply);
    // Observe basemap size changes (e.g., fonts/metrics/UI changes)
    const ro = new ResizeObserver(() => requestAnimationFrame(apply));
    ro.observe(base);
    return () => {
      window.removeEventListener('resize', apply);
      ro.disconnect();
    };
    // Re-run when location, region, or frames availability change
  }, [region, location, frameUrls.length]);

  return (
    <div className="display radar-display">
      <div className="header">
        <div className="logo">
          <img src="/images/logos/logo-corner.png" alt="WeatherStar 4000+" />
        </div>
        <div className="title dual">
          <div className="top">Local</div>
          <div className="bottom">Radar</div>
        </div>
        <div className="right">
          <div className="scale">
            <div className="text">PRECIP&nbsp;&nbsp;Light</div>
            <div className="scale-table">
              <div className="box box-1"></div>
              <div className="box box-2"></div>
              <div className="box box-3"></div>
              <div className="box box-4"></div>
              <div className="box box-5"></div>
              <div className="box box-6"></div>
              <div className="box box-7"></div>
              <div className="box box-8"></div>
            </div>
            <div className="text">Heavy</div>
          </div>
          <div className="time">{timeStr}</div>
        </div>
      </div>
      <div className="main radar" ref={viewRef}>
        <div className="container">
          {/* Local SVG filter: convert near-black to transparency for Mesonet frames */}
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
            <defs>
              <filter id="radarChroma" colorInterpolationFilters="sRGB">
                {/* Put luminance into alpha channel */}
                <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0" result="luma" />
                {/* Boost contrast so very dark becomes alpha 0, colors become opaque */}
                <feComponentTransfer in="luma" result="alpha">
                  <feFuncA type="linear" slope="6" intercept="-0.15" />
                </feComponentTransfer>
                {/* Apply computed alpha to original color */}
                <feComposite in="SourceGraphic" in2="alpha" operator="in" />
              </filter>
            </defs>
          </svg>
          {region === 'hawaii' && (
            <div className="tiles" ref={tilesRef}>
              <img
                src="/images/maps/radar-hawaii.png"
                alt="Hawaii radar"
                ref={baseGridRef as any}
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          )}
          {region === 'alaska' && (
            <div className="tiles" ref={tilesRef}>
              <img
                src="/images/maps/radar-alaska.png"
                alt="Alaska radar"
                ref={baseGridRef as any}
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          )}
          {region === 'conus' && (
            <div className="tiles" style={{ position: 'relative' }} ref={tilesRef}>
              {frameUrls.length > 0 ? (
                <>
                  <img
                    src="/images/maps/radar-stretched.webp"
                    alt="stretched basemap"
                    ref={baseGridRef as any}
                    style={{ display: 'block', width: '100%', height: '100%', position: 'relative', top: '5px', left: '-7px' }}
                  />
                  <div className="frame-overlay" ref={framesRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: '0.6' }}>
                    {frameUrls.map((u, idx) => (
                      <img
                        key={u}
                        src={u}
                        alt="mesonet frame"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: idx === frameIndex ? 1 : 0,
                          transition: 'opacity 180ms linear',
                          width: '100%',
                          height: '100%',
                          objectFit: 'fill',
                          mixBlendMode: 'normal',
                          filter: 'url(#radarChroma)',
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="basemap-grid"
                    style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)` }}
                    ref={baseGridRef}
                  >
                    {Array.from({ length: rows }).map((_, r) => (
                      <React.Fragment key={`b-${r}`}>
                        {Array.from({ length: cols }).map((__, c) => (
                          <img key={`b-${r}-${c}`} src={`/images/maps/radar/map-${r}-${c}.webp`} alt="map tile" />
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                  <div
                    className="overlay-grid"
                    style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)` }}
                    ref={overlayGridRef}
                  >
                    {Array.from({ length: rows }).map((_, r) => (
                      <React.Fragment key={`o-${r}`}>
                        {Array.from({ length: cols }).map((__, c) => (
                          <img key={`o-${r}-${c}`} src={`/images/maps/radar/overlay-${r}-${c}.webp`} alt="overlay tile" />
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Radar;