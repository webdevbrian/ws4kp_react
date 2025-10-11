import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import WeatherDisplay from './components/WeatherDisplay';
import LocationInput from './components/LocationInput';
import NavigationControls from './components/NavigationControls';
import MusicPlayer from './components/MusicPlayer';
import Settings from './components/Settings';
import { AppProvider } from './contexts/AppContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { parseQueryString } from './utils/share';
import { loadAllData } from './utils/data-loader';
import packageJson from '../../package.json';

declare global {
  interface Window {
    WS4KP_SERVER_AVAILABLE?: boolean;
    OVERRIDES?: Record<string, any>;
  }
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isKiosk, setIsKiosk] = useState(false);
  const version = packageJson.version;

  useEffect(() => {
    const initApp = async () => {
      try {
        const overrides = window.OVERRIDES || {};
        await loadAllData(overrides.VERSION || '');

        const query = parseQueryString(window.location.search);
        if (query['settings-kiosk-checkbox'] === 'true') {
          setIsKiosk(true);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load core application data:', error);
        setError('Unable to load Weather Data. Please check your connection and try refreshing.');
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (error) {
    return (
      <div>
        <h2>Unable to load Weather Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div id="loading">
        <div>
          <div className="title">WeatherStar 4000+</div>
          <div className="version">v{version}</div>
          <div className="instructions">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppProvider>
        <NavigationProvider>
          <div className={isKiosk ? 'kiosk' : ''}>
            <LocationInput />
            <div id="version" style={{ display: 'none' }}>
              {version}
            </div>

            <WeatherDisplay version={version} />
            <MusicPlayer />
            <NavigationControls />
            <Settings version={version} />
          </div>
        </NavigationProvider>
      </AppProvider>
    </Router>
  );
};

export default App;