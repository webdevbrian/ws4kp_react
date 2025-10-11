import React, { useMemo } from 'react';
import { useForecastData } from '../../hooks/useForecastData';
import { useApp } from '../../contexts/AppContext';
import HeaderBar from '../HeaderBar';

const ExtendedForecast: React.FC = () => {
  const { location } = useApp();
  const { forecastData, loading, error } = useForecastData();

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  const iconFor = (short: string, isDay: boolean) => {
    const s = short.toLowerCase();
    if (s.includes('thunder')) return isDay ? 'Scattered-Thunderstorms-Day.gif' : 'Scattered-Thunderstorms-Night.gif';
    if (s.includes('showers') || s.includes('shower')) return 'Shower.gif';
    if (s.includes('rain')) return 'Rain.gif';
    if (s.includes('sleet')) return 'Sleet.gif';
    if (s.includes('freezing rain') && s.includes('snow')) return 'Freezing-Rain-Snow.gif';
    if (s.includes('freezing rain')) return 'Freezing-Rain.gif';
    if (s.includes('rain') && s.includes('snow')) return 'Rain-Snow.gif';
    if (s.includes('snow') && s.includes('sleet')) return 'Snow-Sleet.gif';
    if (s.includes('heavy snow')) return 'Heavy-Snow.gif';
    if (s.includes('light snow')) return 'Light-Snow.gif';
    if (s.includes('snow')) return 'Heavy-Snow.gif';
    if (s.includes('fog')) return 'Fog.gif';
    if (s.includes('smoke')) return 'Smoke.gif';
    if (s.includes('wind')) return 'Windy.gif';
    if (s.includes('mostly clear') || (s.includes('clear') && !s.includes('partly'))) return 'Mostly-Clear.gif';
    if (s.includes('sunny')) return 'Sunny.gif';
    if (s.includes('partly') || s.includes('mostly sunny')) return 'Partly-Cloudy.gif';
    if (s.includes('cloudy')) return 'Cloudy.gif';
    return 'No-Data.gif';
  };

  const days = useMemo(() => {
    const periods = forecastData.daily || [];
    const map: Record<string, any> = {};
    periods.forEach(p => {
      const d = new Date(p.startTime);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!map[dateKey]) map[dateKey] = { dateKey, startTime: p.startTime };
      if (p.isDaytime) {
        map[dateKey].hi = p.temperature;
        map[dateKey].dayShort = p.shortForecast;
        map[dateKey].isDay = true;
      } else {
        map[dateKey].lo = p.temperature;
        map[dateKey].nightShort = p.shortForecast;
      }
    });
    const arr = Object.values(map).sort((a: any,b: any)=> a.startTime.localeCompare(b.startTime));
    return arr as Array<{dateKey:string; startTime:string; hi?:number; lo?:number; dayShort?:string; nightShort?:string; isDay?:boolean}>;
  }, [forecastData.daily]);

  const conditionLines = (short?: string) => {
    if (!short) return [''];
    const stop = new Set(['chance','slight','likely','then','and','with','of','becoming','a','the','patchy','areas','mostly','partly']);
    const words = short
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, ''))
      .filter(Boolean)
      .map(w => w.toLowerCase())
      .filter(w => !stop.has(w));
    const pick = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1));
    if (pick.length === 0) return [''];
    if (pick.length === 1) return [pick[0]];
    return [pick[0], pick[1]];
  };

  return (
    <>
      <HeaderBar titleLines={["Extended", "Forecast"]} />
      <div className="main extended-forecast">
        {!location && <div className="day-container"><div className="day"/></div>}
        {loading && <div className="day-container"><div className="day">Loading...</div></div>}
        {error && <div className="day-container"><div className="day">Error</div></div>}
        {!loading && !error && days.length > 0 && (
          <div className="day-container">
            {days.slice(0, 3).map((d, i) => {
              const name = getDayName(d.startTime);
              const iconFile = iconFor(d.dayShort || d.nightShort || '', !!d.isDay);
              const [l1, l2] = conditionLines(d.dayShort || d.nightShort);
              return (
                <div className="day" key={i}>
                  <div className="date">{name}</div>
                  <div className="icon"><img src={`/images/icons/current-conditions/${iconFile}`} alt={l1} /></div>
                  <div className="condition">
                    <div>{l1}</div>
                    {l2 && <div>{l2}</div>}
                  </div>
                  <div className="temperatures">
                    <div className="temperature-block lo">
                      <div className="label">Lo</div>
                      <div className="value">{d.lo !== undefined ? d.lo : '--'}</div>
                    </div>
                    <div className="temperature-block hi" style={{ float: 'right' }}>
                      <div className="label">Hi</div>
                      <div className="value">{d.hi !== undefined ? d.hi : '--'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && !error && days.length === 0 && (forecastData.daily?.length || 0) > 0 && (
          <div className="day-container">
            {(forecastData.daily || [])
              .filter(p => p.isDaytime)
              .slice(0, 3)
              .map((p, i) => {
                const name = getDayName(p.startTime);
                const iconFile = iconFor(p.shortForecast, true);
                // find matching night period same local date for Lo
                const d = new Date(p.startTime);
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const night = (forecastData.daily || []).find(np => !np.isDaytime && (() => { const nd=new Date(np.startTime); return `${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,'0')}-${String(nd.getDate()).padStart(2,'0')}` === key; })());
                const [l1, l2] = conditionLines(p.shortForecast);
                return (
                  <div className="day" key={i}>
                    <div className="date">{name}</div>
                    <div className="icon"><img src={`/images/icons/current-conditions/${iconFile}`} alt={l1} /></div>
                    <div className="condition">
                      <div>{l1}</div>
                      {l2 && <div>{l2}</div>}
                    </div>
                    <div className="temperatures">
                      <div className="temperature-block lo">
                        <div className="label">Lo</div>
                        <div className="value">{night?.temperature ?? '--'}</div>
                      </div>
                      <div className="temperature-block hi" style={{ float: 'right' }}>
                        <div className="label">Hi</div>
                        <div className="value">{p.temperature ?? '--'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
};

export default ExtendedForecast;