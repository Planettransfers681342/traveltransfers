import React, { useState, useEffect, useRef } from 'react';
import { Spinner, X, AirplaneTakeoff } from '@phosphor-icons/react';
import { searchAirports, formatAirportDisplay } from '@/data/airports';

export const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Search address...",
  name,
  required = false,
  dataTestId,
  icon = null,
  iconColor = "text-slate-400"
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Search airports first (prioritized)
      const airportResults = searchAirports(query, 5);
      const airportSuggestions = airportResults.map(airport => ({
        id: `airport-${airport.iata}`,
        display_name: formatAirportDisplay(airport),
        short_name: formatAirportDisplay(airport),
        type: 'airport',
        iata: airport.iata,
        isAirport: true
      }));
      
      // If query looks like IATA code (3 letters), prioritize airports heavily
      const isLikelyIATA = /^[a-z]{3}$/i.test(query.trim());
      
      // Search regular addresses via OpenStreetMap (but not for IATA codes)
      let addressSuggestions = [];
      if (!isLikelyIATA && query.length >= 3) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              }
            }
          );
          const data = await response.json();
          
          addressSuggestions = data.map(item => ({
            id: item.place_id,
            display_name: item.display_name,
            short_name: formatShortAddress(item),
            lat: item.lat,
            lon: item.lon,
            type: item.type,
            address: item.address,
            isAirport: false
          }));
        } catch (error) {
          console.error('Address search error:', error);
        }
      }
      
      // Combine results: airports first, then addresses
      const combined = [...airportSuggestions, ...addressSuggestions].slice(0, 8);
      
      setSuggestions(combined);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatShortAddress = (item) => {
    const addr = item.address || {};
    const parts = [];
    
    if (addr.aeroway || addr.airport) {
      parts.push(addr.aeroway || addr.airport);
    } else if (addr.tourism || addr.amenity || addr.building) {
      parts.push(addr.tourism || addr.amenity || addr.building);
    } else if (addr.road) {
      parts.push(addr.road);
      if (addr.house_number) parts[0] = `${addr.house_number} ${parts[0]}`;
    }
    
    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }
    
    if (addr.country) {
      parts.push(addr.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : item.display_name.split(',').slice(0, 3).join(',');
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 200);
  };

  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.short_name);
    onChange({
      target: {
        name,
        value: suggestion.short_name,
        fullAddress: suggestion.display_name,
        lat: suggestion.lat,
        lon: suggestion.lon,
        isAirport: suggestion.isAirport,
        iata: suggestion.iata
      }
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange({ target: { name, value: '' } });
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        {icon && (
          <div className={`absolute left-4 ${iconColor} pointer-events-none z-10`}>
            {icon}
          </div>
        )}
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`input-field pr-10 ${icon ? 'pl-12' : ''}`}
          required={required}
          autoComplete="off"
          data-testid={dataTestId}
        />
        {isLoading && (
          <Spinner 
            size={18} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" 
          />
        )}
        {!isLoading && inputValue && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {suggestion.isAirport && (
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      <AirplaneTakeoff size={12} weight="bold" />
                      {suggestion.iata}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {suggestion.short_name}
                  </p>
                  {!suggestion.isAirport && suggestion.display_name !== suggestion.short_name && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {suggestion.display_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-lg z-50 p-4 text-center text-sm text-slate-500">
          No airports or addresses found. Try a different search.
        </div>
      )}
    </div>
  );
};
