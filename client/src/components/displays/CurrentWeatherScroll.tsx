import React from 'react';

const CurrentWeatherScroll: React.FC = () => {
  return (
    <div className="display current-weather-scroll-display">
      <div className="header">
        <div className="title">Current Weather Scroll</div>
      </div>
      <div className="content">
        <div className="current-weather-scroll-container">
          <p>Current weather scrolling data will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherScroll;