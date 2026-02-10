import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Spinner, X } from '@phosphor-icons/react';

export const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Search address...",
  name,
  required = false,
  dataTestId
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
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
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
      
      const formattedSuggestions = data.map(item => ({
        id: item.place_id,
        display_name: item.display_name,
        short_name: formatShortAddress(item),
        lat: item.lat,
        lon: item.lon,
        type: item.type,
        address: item.address
      }));
      
      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatShortAddress = (item) => {
    const addr = item.address || {};
    const parts = [];
    
    // Try to build a concise address
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
    
    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.short_name);
    onChange({
      target: {
        name,
        value: suggestion.short_name,
        fullAddress: suggestion.display_name,
        lat: suggestion.lat,
        lon: suggestion.lon
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
      <div className="relative">
        <MapPin 
          size={20} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
        />
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="input-field pl-12 pr-10"
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-lg z-50 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#d4af37] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {suggestion.short_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {suggestion.display_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && inputValue.length >= 3 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-lg z-50 p-4 text-center text-sm text-slate-500">
          No addresses found. Try a different search.
        </div>
      )}
    </div>
  );
};
