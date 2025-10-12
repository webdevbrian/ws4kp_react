import React from 'react';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';
import { getWeatherIconPath } from '../../utils/weatherIcons';

const CurrentWeather: React.FC = () => {
  const { location } = useApp();
  const { weatherData, loading, error } = useWeatherData();

  const titleTop = 'Current';
  const titleBottom = 'Conditions';

  const iconSrc = getWeatherIconPath(weatherData?.conditions, weatherData?.icon);
  const tempStr = weatherData?.temperature !== undefined ? `${Math.round(weatherData.temperature)}°` : '--°';
  const condStr = weatherData?.conditions || '';
  const cityStr = location?.city || '';

  return (
    <div className="display current-weather-display">
      <HeaderBar titleLines={[titleTop, titleBottom]} />
      <div className="main" style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 530, height: 330 }}>
          {!location && (
            <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Enter a location to view weather data</div>
          )}
          {loading && (
            <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Loading current conditions...</div>
          )}
          {error && (
            <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 16, padding: '20px' }}>Error: {error}</div>
          )}

          {weatherData && !loading && (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Left side: temp, conditions, big icon */}
              <div style={{ position: 'absolute', left: 18, top: 12 }}>
                <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 56, lineHeight: 1, textShadow: '3px 2px 0 #000' }}>{tempStr}</div>
                <div
                  style={{
                    color: 'white',
                    fontFamily: 'Star4000',
                    fontSize: 32,
                    lineHeight: 1.1,
                    textShadow: '3px 2px 0 #000',
                    marginTop: 6,
                    width: 210,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    maxHeight: 32 * 1.1 * 2,
                    display: 'block',
                  }}
                >
                  {condStr}
                </div>
                <img src={iconSrc} alt={condStr || 'conditions'} style={{ width: 160, height: 120, imageRendering: 'pixelated', marginTop: 6 }} />
                {/* Wind row */}
                {(weatherData.windSpeed !== undefined || weatherData.windDirection) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                    <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 26, textShadow: '3px 2px 0 #000' }}>Wind:</div>
                    <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 26, textShadow: '3px 2px 0 #000' }}>
                      {(weatherData.windDirection || '') + (weatherData.windSpeed !== undefined ? `  ${weatherData.windSpeed}` : '')}
                    </div>
                  </div>
                )}
              </div>

              {/* City name near top center */}
              <div style={{ position: 'absolute', left: '50%', top: 13, transform: 'translateX(-50%)', color: '#ffe600', fontFamily: 'Star4000', fontSize: 26, textShadow: '3px 2px 0 #000', zIndex: 2 }}>
                {cityStr}
              </div>

              {/* Right column stats */}
              <div style={{ position: 'absolute', right: 18, top: 64, width: 260, zIndex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 10, columnGap: 12 }}>
                  {weatherData.humidity !== undefined && (
                    <>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000' }}>Humidity:</div>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000', textAlign: 'right' }}>{Math.round(weatherData.humidity)}%</div>
                    </>
                  )}
                  {weatherData.temperature !== undefined && (
                    <>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000' }}>Dewpoint:</div>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000', textAlign: 'right' }}>--°</div>
                    </>
                  )}
                  {weatherData.visibility !== undefined && (
                    <>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000' }}>Visibility:</div>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000', textAlign: 'right' }}>{weatherData.visibility} mi.</div>
                    </>
                  )}
                  {/* Ceiling not available in our data; show placeholder */}
                  <>
                    <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000' }}>Ceiling:</div>
                    <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000', textAlign: 'right' }}>--</div>
                  </>
                  {weatherData.pressure && (
                    <>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000' }}>Pressure:</div>
                      <div style={{ color: 'white', fontFamily: 'Star4000', fontSize: 22, textShadow: '3px 2px 0 #000', textAlign: 'right' }}>{weatherData.pressure}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentWeather;