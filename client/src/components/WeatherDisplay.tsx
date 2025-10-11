import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useApp } from '../contexts/AppContext';
import Progress from './displays/Progress';
import Hourly from './displays/Hourly';
import HourlyGraph from './displays/HourlyGraph';
import Travel from './displays/Travel';
import CurrentWeather from './displays/CurrentWeather';
import LocalForecast from './displays/LocalForecast';
import LatestObservations from './displays/LatestObservations';
import RegionalForecast from './displays/RegionalForecast';
import Almanac from './displays/Almanac';
import SpcOutlook from './displays/SpcOutlook';
import ExtendedForecast from './displays/ExtendedForecast';
import Radar from './displays/Radar';
import Hazards from './displays/Hazards';
import CurrentWeatherScroll from './displays/CurrentWeatherScroll';

interface WeatherDisplayProps {
  version: string;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ version }) => {
  const { currentDisplay } = useNavigation();
  const { location } = useApp();

  // Log current display for debugging
  console.log('Current display:', currentDisplay);

  if (!location) {
    return (
      <div id="divTwc">
        <div id="divTwcMain">
          <div id="container">
            <div id="loading">
              <div>
                <div className="title">WeatherStar 4000+</div>
                <div className="version">v{version}</div>
                <div className="instructions">Enter your location above to continue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="divTwc">
      <div id="divTwcMain">
        <div id="container">
          <div
            id="progress-html"
            className={`weather-display ${currentDisplay === 'progress' ? 'show' : ''}`}
          >
            <Progress />
          </div>
          <div
            id="hourly-html"
            className={`weather-display ${currentDisplay === 'hourly' ? 'show' : ''}`}
          >
            <Hourly />
          </div>
          <div
            id="hourly-graph-html"
            className={`weather-display ${currentDisplay === 'hourly-graph' ? 'show' : ''}`}
          >
            <HourlyGraph />
          </div>
          <div
            id="travel-html"
            className={`weather-display ${currentDisplay === 'travel' ? 'show' : ''}`}
          >
            <Travel />
          </div>
          <div
            id="current-weather-html"
            className={`weather-display ${currentDisplay === 'current-weather' ? 'show' : ''}`}
          >
            <CurrentWeather />
          </div>
          <div
            id="local-forecast-html"
            className={`weather-display ${currentDisplay === 'local-forecast' ? 'show' : ''}`}
          >
            <LocalForecast />
          </div>
          <div
            id="latest-observations-html"
            className={`weather-display ${currentDisplay === 'latest-observations' ? 'show' : ''}`}
          >
            <LatestObservations />
          </div>
          <div
            id="regional-forecast-html"
            className={`weather-display ${currentDisplay === 'regional-forecast' ? 'show' : ''}`}
          >
            <RegionalForecast />
          </div>
          <div
            id="almanac-html"
            className={`weather-display ${currentDisplay === 'almanac' ? 'show' : ''}`}
          >
            <Almanac />
          </div>
          <div
            id="spc-outlook-html"
            className={`weather-display ${currentDisplay === 'spc-outlook' ? 'show' : ''}`}
          >
            <SpcOutlook />
          </div>
          <div
            id="extended-forecast-html"
            className={`weather-display ${currentDisplay === 'extended-forecast' ? 'show' : ''}`}
          >
            <ExtendedForecast />
          </div>
          <div
            id="radar-html"
            className={`weather-display ${currentDisplay === 'radar' ? 'show' : ''}`}
          >
            <Radar />
          </div>
          <div
            id="hazards-html"
            className={`weather-display ${currentDisplay === 'hazards' ? 'show' : ''}`}
          >
            <Hazards />
          </div>
          {currentDisplay !== 'radar' && <CurrentWeatherScroll />}
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;