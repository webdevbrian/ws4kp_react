import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '../contexts/NavigationContext';
import { generateShareLink } from '../utils/share';

interface SettingsProps {
  version: string;
}

const Settings: React.FC<SettingsProps> = ({ version }) => {
  const {
    location,
    musicTrack,
    youtubeEnabled,
    setYoutubeEnabled,
    youtubeUrl,
    setYoutubeUrl,
    youtubeRandomSeek,
    setYoutubeRandomSeek
  } = useApp();
  const { displays, setDisplays } = useNavigation();
  const [linkCopied, setLinkCopied] = useState(false);
  const [tempYoutubeUrl, setTempYoutubeUrl] = useState(youtubeUrl);

  const handleDisplayToggle = (display: string) => {
    if (displays.includes(display)) {
      setDisplays(displays.filter(d => d !== display));
    } else {
      setDisplays([...displays, display]);
    }
  };

  const handleShareLink = () => {
    const params = {
      location: location ? `${location.latitude},${location.longitude}` : '',
    };
    const link = generateShareLink(params);

    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    });
  };

  const handleSetYoutubeUrl = () => {
    setYoutubeUrl(tempYoutubeUrl);
  };

  return (
    <div className="content-wrapper">
      <br />

      <div className="info">
        <a href="https://github.com/netbymatt/ws4kp#weatherstar-4000">More information</a>
      </div>
      <div className="media"></div>

      <div className="heading">Selected displays</div>
      <div id="enabledDisplays">
        {[
          'hourly',
          'hourly-graph',
          'travel',
          'current-weather',
          'local-forecast',
          'latest-observations',
          'regional-forecast',
          'almanac',
          'spc-outlook',
          'extended-forecast',
          'radar',
          'hazards'
        ].map(display => (
          <label key={display}>
            <input
              type="checkbox"
              checked={displays.includes(display)}
              onChange={() => handleDisplayToggle(display)}
            />
            {display.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </label>
        ))}
      </div>

      <div className="heading">Settings</div>
      <div id="settings">
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={youtubeEnabled}
              onChange={(e) => setYoutubeEnabled(e.target.checked)}
            />
            Use YouTube for background music
          </label>

          {youtubeEnabled && (
            <>
              <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  YouTube URL:
                </label>
                <input
                  type="text"
                  value={tempYoutubeUrl}
                  onChange={(e) => setTempYoutubeUrl(e.target.value)}
                  style={{ width: '300px', marginRight: '10px' }}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <button onClick={handleSetYoutubeUrl}>Set</button>
              </div>

              <div style={{ marginLeft: '20px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={youtubeRandomSeek}
                    onChange={(e) => setYoutubeRandomSeek(e.target.checked)}
                  />
                  Start at random position
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="heading">Sharing</div>
      <div className="info">
        <a href="#" id="share-link" onClick={handleShareLink}>Copy Permalink</a>
        {linkCopied && <span id="share-link-copied"> Link copied to clipboard!</span>}
        <div id="share-link-instructions">
          Copy this long URL:
          <input type="text" id="share-link-url" readOnly value={generateShareLink({})} />
        </div>
      </div>

      <div className="heading">Headend Information</div>
      <div id="divInfo">
        Location: <span id="spanCity">{location?.city}</span> <span id="spanState">{location?.state}</span><br />
        Station Id: <span id="spanStationId">{location?.stationId}</span><br />
        Radar Id: <span id="spanRadarId">{location?.radarId}</span><br />
        Zone Id: <span id="spanZoneId">{location?.zoneId}</span><br />
        Office Id: <span id="spanOfficeId">{location?.officeId}</span><br />
        Grid X,Y: <span id="spanGridPoint">{location?.gridX},{location?.gridY}</span><br />
        Music: <span id="musicTrack">{musicTrack}</span><br />
        Ws4kp Version: <span>{version}</span>
      </div>
    </div>
  );
};

export default Settings;