import React, { useEffect, useState } from 'react';

interface ProgressItem {
  name: string;
  status: 'loading' | 'loaded' | 'error' | 'retrying';
  error?: string;
}

const Progress: React.FC = () => {
  const [items, setItems] = useState<ProgressItem[]>([
    { name: 'Current Conditions', status: 'loading' },
    { name: 'Latest Observations', status: 'loading' },
    { name: 'Hourly Forecast', status: 'loading' },
    { name: 'Travel Cities', status: 'loading' },
    { name: 'Regional Forecast', status: 'loading' },
    { name: 'Local Forecast', status: 'loading' },
    { name: 'Extended Forecast', status: 'loading' },
    { name: 'Almanac', status: 'loading' },
    { name: 'Radar', status: 'loading' },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(prevItems => prevItems.map(item => ({ ...item, status: 'loaded' })));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="display progress-display">
      <div className="header">
        <div className="title">WeatherStar 4000+</div>
      </div>
      <div className="content">
        <div className="progress-container">
          {items.map((item, index) => (
            <div key={index} className={`progress-item ${item.status}`}>
              <span className="progress-name">{item.name}</span>
              <span className="progress-status">
                {item.status === 'loading' && '...'}
                {item.status === 'loaded' && '✓'}
                {item.status === 'error' && '✗'}
                {item.status === 'retrying' && '↻'}
              </span>
              {item.error && <span className="progress-error">{item.error}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Progress;