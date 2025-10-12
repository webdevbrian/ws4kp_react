import React, { useMemo } from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

const Hourly: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();

  const titleTop = 'Hourly';
  const titleBottom = 'Forecast';

  const formatDayTime = (dateString: string) => {
    const d = new Date(dateString);
    const wd = d.toLocaleString(undefined, { weekday: 'short' });
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${wd}, ${displayH} ${ampm}`;
  };

  const getRegionalMapIcon = (shortForecast?: string, isDay?: boolean) => {
    const s = (shortForecast || '').toLowerCase();
    const base = '/images/icons/regional-maps';
    const isNight = isDay === false;
    if (s.includes('thunder')) {
      // Use scattered t-storms variant when text indicates scattered
      if (s.includes('scattered')) return `${base}/${isNight ? 'Scattered-Tstorms-Night-1994.gif' : 'Scattered-Tstorms-1994.gif'}`;
      return `${base}/Thunderstorm.gif`;
    }
    if (s.includes('heavy') && s.includes('snow')) return `${base}/Heavy-Snow-1994.gif`;
    if (s.includes('blowing') && s.includes('snow')) return `${base}/Blowing-Snow.gif`;
    if (s.includes('snow') && s.includes('sleet')) return `${base}/Snow-Sleet.gif`;
    if (s.includes('rain') && s.includes('sleet')) return `${base}/Rain-Sleet.gif`;
    if (s.includes('rain') && s.includes('snow')) return `${base}/Rain-Snow-1992.gif`;
    if (s.includes('sleet') || s.includes('freezing')) return `${base}/Sleet.gif`;
    if (s.includes('snow')) return `${base}/Light-Snow.gif`;
    if (s.includes('scattered') && s.includes('shower')) return `${base}/${isNight ? 'Scattered-Showers-Night-1994.gif' : 'Scattered-Showers-1994.gif'}`;
    if (s.includes('showers') || (s.includes('rain') && !s.includes('snow'))) return `${base}/Rain-1992.gif`;
    if (s.includes('fog') || s.includes('mist')) return `${base}/Fog.gif`;
    if (s.includes('haze') || s.includes('smoke')) return `${base}/Haze.gif`;
    if (s.includes('wind')) {
      // Choose wind variants when clear/sunny vs generic windy
      if (s.includes('clear') || s.includes('fair') || s.includes('sunny')) {
        return `${base}/${isNight ? 'Clear-Wind-1994.gif' : 'Sunny-Wind-1994.gif'}`;
      }
      return `${base}/Wind.gif`;
    }
    if (s.includes('partly')) return `${base}/${isNight ? 'Partly-Cloudy-Night.gif' : 'Partly-Cloudy.gif'}`;
    if (s.includes('mostly') && s.includes('cloud')) return `${base}/Mostly-Cloudy-1994.gif`;
    if (s.includes('cloud')) return `${base}/Cloudy.gif`;
    if (s.includes('clear') || s.includes('fair') || s.includes('sunny')) return `${base}/${isNight ? 'Clear-1992.gif' : 'Sunny.gif'}`;
    return `${base}/Cloudy.gif`;
  };

  const windStatus = (windSpeed: string) => {
    // Extract the highest numeric value from strings like "5 to 10 mph" or "15 mph"
    const nums = (windSpeed || '').match(/\d+/g)?.map(n => parseInt(n, 10)) || [0];
    const v = Math.max(...nums);
    if (v === 0) return 'Calm';
    if (v <= 10) return 'Light';
    if (v <= 20) return 'Breezy';
    if (v <= 30) return 'Windy';
    if (v <= 40) return 'Gusty';
    return 'Strong';
  };

  const hours = useMemo(() => {
    const list = forecastData.hourly || [];
    if (list.length === 0) return [];
    const now = new Date();
    // Prefer the period that currently contains 'now'
    let startIndex = list.findIndex(p => {
      const start = new Date(p.startTime);
      const end = new Date(p.endTime);
      return start <= now && now < end;
    });
    // If not found, use the first period that starts after 'now'
    if (startIndex === -1) {
      startIndex = list.findIndex(p => new Date(p.startTime) >= now);
      if (startIndex === -1) startIndex = 0;
    }
    return list.slice(startIndex, startIndex + 4);
  }, [forecastData.hourly]);

  return (
    <div id="hourly-html" className="display hourly-display" style={{ position: 'relative' }}>
      <HeaderBar titleLines={[titleTop, titleBottom]} />
      <div className="main hourly" style={{ marginTop: 10, zIndex: 0, position: 'relative', width: 530, margin: '0 auto' }}>
        <div style={{ position: 'relative', width: '100%', minHeight: 330 }}>
          {!location && (
            <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Enter a location to view hourly forecast</div>
          )}
          {loading && (
            <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Loading hourly forecast...</div>
          )}
          {error && (
            <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Error: {error}</div>
          )}

          {hours.length > 0 && !loading && (
            <div style={{ paddingTop: 6 }}>
              {/* Column labels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 78px 78px 92px', alignItems: 'center', padding: '2px 0 8px', columnGap: 6 }}>
                <div />
                <div />
                <div style={{ color: '#ffe600', fontFamily: 'Star4000', fontSize: 16, textShadow: '2px 1px 0 #000', textAlign: 'center' }}>TEMP</div>
                <div style={{ color: '#ffe600', fontFamily: 'Star4000', fontSize: 16, textShadow: '2px 1px 0 #000', textAlign: 'center' }}>LIKE</div>
                <div style={{ color: '#ffe600', fontFamily: 'Star4000', fontSize: 16, textShadow: '2px 1px 0 #000', textAlign: 'left' }}>WIND</div>
              </div>

              {/* Four stacked rows */}
              <div style={{ display: 'grid', rowGap: 12 }}>
                {hours.map((h, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 78px 78px 92px', alignItems: 'center', columnGap: 6 }}>
                    {/* Day, time */}
                    <div style={{ color: '#ffe600', fontFamily: 'Star4000', fontSize: 32, lineHeight: 1, textShadow: '3px 2px 0 #000' }}>
                      {formatDayTime(h.startTime)}
                    </div>
                    {/* Icon */}
                    <div style={{ textAlign: 'center' }}>
                      <img src={getRegionalMapIcon(h.shortForecast, h.isDaytime)} alt={h.shortForecast || 'icon'} style={{ width: 56, height: 42, imageRendering: 'pixelated' }} />
                    </div>
                    {/* Temp */}
                    <div style={{ color: '#ffe600', fontFamily: 'Star4000', fontSize: 32, lineHeight: 1, textAlign: 'center', textShadow: '3px 2px 0 #000' }}>
                      {h.temperature}
                    </div>
                    {/* Like (using temperature for now) */}
                    <div style={{ color: '#ffe600', fontFamily: 'Star4000', fontSize: 32, lineHeight: 1, textAlign: 'center', textShadow: '3px 2px 0 #000' }}>
                      {h.temperature}
                    </div>
                    {/* Wind status */}
                    <div style={{ color: '#ffe600', fontFamily: 'Star4000', fontSize: 32, lineHeight: 1, textAlign: 'left', textShadow: '3px 2px 0 #000' }}>
                      {windStatus(h.windSpeed)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hourly;