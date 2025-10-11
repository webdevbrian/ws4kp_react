import React, { useEffect, useState } from 'react';

type ImageStatus = 'idle' | 'loading' | 'loaded' | 'error';

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = err => reject(err);
    img.src = src;
  });

const SpcOutlook: React.FC = () => {
  const [day1Url] = useState(
    `https://www.spc.noaa.gov/products/outlook/day1otlk_cat.png?u=${Date.now()}`
  );
  const [day2Url] = useState(
    `https://www.spc.noaa.gov/products/outlook/day2otlk_cat.png?u=${Date.now()}`
  );

  const [day1Status, setDay1Status] = useState<ImageStatus>('idle');
  const [day2Status, setDay2Status] = useState<ImageStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const withFallback = async (primary: string) => {
      // Try primary (direct HTTPS), then fallback to local proxy
      const fallback = primary.replace('https://www.spc.noaa.gov', '/spc');
      try {
        await loadImage(primary);
        return 'loaded' as ImageStatus;
      } catch (e1) {
        console.warn('Primary SPC image failed, trying proxy:', primary, e1);
        try {
          await loadImage(fallback);
          return 'loaded' as ImageStatus;
        } catch (e2) {
          console.warn('Proxy SPC image failed:', fallback, e2);
          return 'error' as ImageStatus;
        }
      }
    };

    const run = async () => {
      setError(null);
      setDay1Status('loading');
      setDay2Status('loading');
      try {
        const [s1, s2] = await Promise.all([withFallback(day1Url), withFallback(day2Url)]);
        if (!mounted) return;
        setDay1Status(s1);
        setDay2Status(s2);
        if (s1 === 'error' && s2 === 'error') {
          setError('SPC images failed to load');
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load SPC outlook');
      }
    };

    run();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day1Url, day2Url]);

  return (
    <div className="display spc-outlook-display">
      <div className="header">
        <div className="title">SPC Outlook</div>
      </div>
      <div className="content">
        <div className="spc-outlook">
          <div className="spc-outlook-container">
            {(day1Status === 'loading' || day2Status === 'loading') && <p>Loading SPC outlook...</p>}
            {error && <p>Error: {error}</p>}
            {!error && (
              <>
                {day1Status === 'loaded' && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="day-name" style={{ fontWeight: 'bold', marginBottom: 8 }}>Day 1</div>
                    <img src={day1Url} alt="SPC Day 1 categorical outlook" style={{ maxWidth: '100%', height: 'auto' }} />
                  </div>
                )}
                {day2Status === 'loaded' && (
                  <div>
                    <div className="day-name" style={{ fontWeight: 'bold', marginBottom: 8 }}>Day 2</div>
                    <img src={day2Url} alt="SPC Day 2 categorical outlook" style={{ maxWidth: '100%', height: 'auto' }} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpcOutlook;