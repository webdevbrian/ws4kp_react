import React, { useEffect, useState } from 'react';

interface HeaderBarProps {
  titleLines: [string] | [string, string];
}

const HeaderBar: React.FC<HeaderBarProps> = ({ titleLines }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase();

  const isDual = (titleLines as string[]).length === 2;

  return (
    <div className="header">
      <div className="logo">
        <img src="/images/logos/logo-corner.png" alt="WeatherStar 4000+" />
      </div>

      <div className={`title ${isDual ? 'dual' : 'single'}`}>
        {isDual ? (
          <>
            <div className="top">{titleLines[0]}</div>
            <div className="bottom">{titleLines[1]}</div>
          </>
        ) : (
          <div className="single">{titleLines[0]}</div>
        )}
      </div>

      <div className="date-time time">{timeStr}</div>
      <div className="date-time date">{dateStr}</div>
    </div>
  );
};

export default HeaderBar;
