import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface AutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
}

interface Suggestion {
  value: string;
  data: string;
}

const categories = [
  'Land Features',
  'Bay', 'Channel', 'Cove', 'Dam', 'Delta', 'Gulf', 'Lagoon', 'Lake', 'Ocean', 'Reef', 'Reservoir', 'Sea', 'Sound', 'Strait', 'Waterfall', 'Wharf',
  'Amusement Park', 'Historical Monument', 'Landmark', 'Tourist Attraction', 'Zoo',
  'College',
  'Beach', 'Campground', 'Golf Course', 'Harbor', 'Nature Reserve', 'Other Parks and Outdoors', 'Park', 'Racetrack',
  'Scenic Overlook', 'Ski Resort', 'Sports Center', 'Sports Field', 'Wildlife Reserve',
  'Airport', 'Ferry', 'Marina', 'Pier', 'Port', 'Resort',
  'Postal', 'Populated Place',
];

const AutoComplete = forwardRef<HTMLInputElement, AutoCompleteProps>(
  ({ value, onChange, onSubmit, placeholder }, ref) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceTimer = useRef<NodeJS.Timeout>();
    // Prevents the dropdown from re-opening immediately after a selection updates the value
    const suppressNextFetch = useRef(false);

    const fetchSuggestions = useCallback(async (query: string) => {
      if (suppressNextFetch.current) {
        suppressNextFetch.current = false;
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest', {
          params: {
            text: query,
            f: 'json',
            countryCode: 'USA',
            category: categories.join(','),
            maxSuggestions: 10,
          },
        });

        if (response.data.suggestions) {
          setSuggestions(
            response.data.suggestions.map((item: any) => ({
              value: item.text,
              data: item.magicKey,
            }))
          );
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, []);

    useEffect(() => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);

      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }, [value, fetchSuggestions]);

    const handleSelect = (suggestion: Suggestion) => {
      // Close and suppress immediate re-open caused by value change debounced fetch
      suppressNextFetch.current = true;
      setShowSuggestions(false);
      setSuggestions([]);
      onChange(suggestion.value);
      onSubmit(suggestion.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelect(suggestions[selectedIndex]);
          } else {
            onSubmit(value);
          }
          setShowSuggestions(false);
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    };

    return (
      <div className="autocomplete-container">
        <input
          ref={ref}
          id="txtLocation"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          placeholder={placeholder}
          data-1p-ignore
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="autocomplete-suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.value}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

AutoComplete.displayName = 'AutoComplete';

export default AutoComplete;