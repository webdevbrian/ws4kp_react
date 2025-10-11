export const getWeatherIconPath = (conditions?: string, icon?: string): string => {
  // Default icon
  const defaultIcon = '/images/icons/current-conditions/No-Data.gif';

  // If we have an icon name from API, try to map it
  if (icon) {
    // Map NWS icon names to our local icon files
    const iconMappings: Record<string, string> = {
      'skc': 'Clear',
      'few': 'Mostly-Clear',
      'sct': 'Partly-Cloudy',
      'bkn': 'Cloudy',
      'ovc': 'Cloudy',
      'wind_skc': 'Clear',
      'wind_few': 'Mostly-Clear',
      'wind_sct': 'Partly-Cloudy',
      'wind_bkn': 'Cloudy',
      'wind_ovc': 'Cloudy',
      'snow': 'Light-Snow',
      'rain_snow': 'Rain-Snow',
      'rain_sleet': 'Rain-Sleet',
      'snow_sleet': 'Snow-Sleet',
      'fzra': 'Freezing-Rain',
      'rain_fzra': 'Freezing-Rain',
      'snow_fzra': 'Freezing-Rain-Snow',
      'sleet': 'Sleet',
      'rain': 'Rain',
      'rain_showers': 'Shower',
      'rain_showers_hi': 'Shower',
      'tsra': 'Thunderstorm',
      'tsra_sct': 'Scattered-Thunderstorms-Day',
      'tsra_hi': 'Thunderstorm',
      'tornado': 'Thunderstorm',
      'hurricane': 'Thunderstorm',
      'tropical_storm': 'Thunderstorm',
      'dust': 'Smoke',
      'smoke': 'Smoke',
      'haze': 'Fog',
      'fog': 'Fog',
      'wind': 'Windy'
    };

    // Try to extract base icon name (remove day/night indicator)
    const baseIcon = icon.replace(/^n/, '').replace(/^day_/, '').replace(/^night_/, '');

    if (iconMappings[baseIcon]) {
      return `/images/icons/current-conditions/${iconMappings[baseIcon]}.gif`;
    }
  }

  // Fall back to parsing conditions text
  if (conditions) {
    const conditionsLower = conditions.toLowerCase();

    if (conditionsLower.includes('clear') || conditionsLower.includes('sunny')) {
      return '/images/icons/current-conditions/Clear.gif';
    }
    if (conditionsLower.includes('mostly clear') || conditionsLower.includes('fair')) {
      return '/images/icons/current-conditions/Mostly-Clear.gif';
    }
    if (conditionsLower.includes('partly cloudy') || conditionsLower.includes('partly sunny')) {
      return '/images/icons/current-conditions/Partly-Cloudy.gif';
    }
    if (conditionsLower.includes('mostly cloudy')) {
      return '/images/icons/current-conditions/Cloudy.gif';
    }
    if (conditionsLower.includes('cloudy') || conditionsLower.includes('overcast')) {
      return '/images/icons/current-conditions/Cloudy.gif';
    }
    if (conditionsLower.includes('thunderstorm') || conditionsLower.includes('t-storm')) {
      return '/images/icons/current-conditions/Thunderstorm.gif';
    }
    if (conditionsLower.includes('heavy snow')) {
      return '/images/icons/current-conditions/Heavy-Snow.gif';
    }
    if (conditionsLower.includes('snow')) {
      return '/images/icons/current-conditions/Light-Snow.gif';
    }
    if (conditionsLower.includes('freezing rain') || conditionsLower.includes('sleet')) {
      return '/images/icons/current-conditions/Freezing-Rain.gif';
    }
    if (conditionsLower.includes('rain')) {
      return '/images/icons/current-conditions/Rain.gif';
    }
    if (conditionsLower.includes('fog') || conditionsLower.includes('mist') || conditionsLower.includes('haze')) {
      return '/images/icons/current-conditions/Fog.gif';
    }
    if (conditionsLower.includes('wind')) {
      return '/images/icons/current-conditions/Windy.gif';
    }
  }

  return defaultIcon;
};