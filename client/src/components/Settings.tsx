import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '../contexts/NavigationContext';
import { generateShareLink } from '../utils/share';

interface SettingsProps {
  version: string;
}

const Settings: React.FC<SettingsProps> = ({ version }) => {
  const { location, musicTrack } = useApp();
  const { displays, setDisplays } = useNavigation();
  const [linkCopied, setLinkCopied] = useState(false);

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