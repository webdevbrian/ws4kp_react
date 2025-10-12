import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import AutoComplete from './AutoComplete';

const LocationInput: React.FC = () => {
  const [locationText, setLocationText] = useState('');
  const { setLocation } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode to get City, State for UI and app state
        (async () => {
          try {
            const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${longitude},${latitude}&f=pjson`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.City || addr.PlaceName || '';
            const state = addr.Region || addr.ShortRegion || '';
            setLocation({ latitude, longitude, city, state });
            setLocationText([city, state].filter(Boolean).join(', '));
          } catch (e) {
            console.warn('Reverse geocode failed, falling back to coordinates', e);
            setLocation({ latitude, longitude });
            setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        })();
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enter it manually.');
      }
    );
  };

  const handleSubmit = async (value: string) => {
    try {
      // Check if input looks like coordinates (two numbers separated by comma)
      const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
      const match = value.match(coordPattern);

      if (match) {
        // Parse as coordinates
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);

        // Determine which is latitude and which is longitude
        // Latitude is typically between -90 and 90
        // Longitude is typically between -180 and 180
        let latitude: number;
        let longitude: number;

        if (Math.abs(num1) <= 90 && Math.abs(num2) <= 180) {
          // Assume first is latitude, second is longitude
          latitude = num1;
          longitude = num2;
        } else if (Math.abs(num2) <= 90 && Math.abs(num1) <= 180) {
          // Assume second is latitude, first is longitude
          latitude = num2;
          longitude = num1;
        } else {
          // Default assumption
          latitude = num1;
          longitude = num2;
        }

        setLocation({ latitude, longitude });
        setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        return;
      }

      // Not coordinates, use geocoding service
      const response = await fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?` +
        `text=${encodeURIComponent(value)}&f=json&outFields=*`
      );
      const data = await response.json();

      if (data.locations && data.locations.length > 0) {
        const loc = data.locations[0];
        setLocation({
          latitude: loc.feature.geometry.y,
          longitude: loc.feature.geometry.x,
          city: loc.feature.attributes.City,
          state: loc.feature.attributes.Region,
        });
        setLocationText(`${loc.feature.attributes.City || ''}, ${loc.feature.attributes.Region || ''}`);
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  const handleClear = () => {
    setLocationText('');
    setLocation(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div id="divQuery">
      <AutoComplete
        ref={inputRef}
        value={locationText}
        onChange={setLocationText}
        onSubmit={handleSubmit}
        placeholder="ZIP Code or City, State"
      />
      <div className="buttons">
        {navigator.geolocation && (
          <button
            id="btnGetGps"
            type="button"
            title="Get GPS Location"
            onClick={handleGetGps}
          >
            <img src="/images/nav/ic_gps_fixed_black_18dp_1x.png" className="light" />
            <img src="/images/nav/ic_gps_fixed_white_18dp_1x.png" className="dark" />
          </button>
        )}
        <button
          id="btnGetLatLng"
          type="submit"
          onClick={() => handleSubmit(locationText)}
        >
          GO
        </button>
        <button
          id="btnClearQuery"
          type="reset"
          onClick={handleClear}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default LocationInput;