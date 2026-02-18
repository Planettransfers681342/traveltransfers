import React, { useState, useEffect, useRef } from 'react';
import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';

// Country data with calling codes, ISO codes, and flag emojis
export const COUNTRIES = [
  { iso: "GB", name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { iso: "US", name: "United States", code: "+1", flag: "🇺🇸" },
  { iso: "BG", name: "Bulgaria", code: "+359", flag: "🇧🇬" },
  { iso: "DE", name: "Germany", code: "+49", flag: "🇩🇪" },
  { iso: "FR", name: "France", code: "+33", flag: "🇫🇷" },
  { iso: "ES", name: "Spain", code: "+34", flag: "🇪🇸" },
  { iso: "IT", name: "Italy", code: "+39", flag: "🇮🇹" },
  { iso: "PT", name: "Portugal", code: "+351", flag: "🇵🇹" },
  { iso: "NL", name: "Netherlands", code: "+31", flag: "🇳🇱" },
  { iso: "BE", name: "Belgium", code: "+32", flag: "🇧🇪" },
  { iso: "CH", name: "Switzerland", code: "+41", flag: "🇨🇭" },
  { iso: "AT", name: "Austria", code: "+43", flag: "🇦🇹" },
  { iso: "PL", name: "Poland", code: "+48", flag: "🇵🇱" },
  { iso: "CZ", name: "Czech Republic", code: "+420", flag: "🇨🇿" },
  { iso: "HU", name: "Hungary", code: "+36", flag: "🇭🇺" },
  { iso: "RO", name: "Romania", code: "+40", flag: "🇷🇴" },
  { iso: "GR", name: "Greece", code: "+30", flag: "🇬🇷" },
  { iso: "TR", name: "Turkey", code: "+90", flag: "🇹🇷" },
  { iso: "SE", name: "Sweden", code: "+46", flag: "🇸🇪" },
  { iso: "NO", name: "Norway", code: "+47", flag: "🇳🇴" },
  { iso: "DK", name: "Denmark", code: "+45", flag: "🇩🇰" },
  { iso: "FI", name: "Finland", code: "+358", flag: "🇫🇮" },
  { iso: "IE", name: "Ireland", code: "+353", flag: "🇮🇪" },
  { iso: "RU", name: "Russia", code: "+7", flag: "🇷🇺" },
  { iso: "UA", name: "Ukraine", code: "+380", flag: "🇺🇦" },
  { iso: "CA", name: "Canada", code: "+1", flag: "🇨🇦" },
  { iso: "MX", name: "Mexico", code: "+52", flag: "🇲🇽" },
  { iso: "BR", name: "Brazil", code: "+55", flag: "🇧🇷" },
  { iso: "AR", name: "Argentina", code: "+54", flag: "🇦🇷" },
  { iso: "CL", name: "Chile", code: "+56", flag: "🇨🇱" },
  { iso: "CO", name: "Colombia", code: "+57", flag: "🇨🇴" },
  { iso: "PE", name: "Peru", code: "+51", flag: "🇵🇪" },
  { iso: "AU", name: "Australia", code: "+61", flag: "🇦🇺" },
  { iso: "NZ", name: "New Zealand", code: "+64", flag: "🇳🇿" },
  { iso: "JP", name: "Japan", code: "+81", flag: "🇯🇵" },
  { iso: "KR", name: "South Korea", code: "+82", flag: "🇰🇷" },
  { iso: "CN", name: "China", code: "+86", flag: "🇨🇳" },
  { iso: "HK", name: "Hong Kong", code: "+852", flag: "🇭🇰" },
  { iso: "TW", name: "Taiwan", code: "+886", flag: "🇹🇼" },
  { iso: "SG", name: "Singapore", code: "+65", flag: "🇸🇬" },
  { iso: "MY", name: "Malaysia", code: "+60", flag: "🇲🇾" },
  { iso: "TH", name: "Thailand", code: "+66", flag: "🇹🇭" },
  { iso: "VN", name: "Vietnam", code: "+84", flag: "🇻🇳" },
  { iso: "PH", name: "Philippines", code: "+63", flag: "🇵🇭" },
  { iso: "ID", name: "Indonesia", code: "+62", flag: "🇮🇩" },
  { iso: "IN", name: "India", code: "+91", flag: "🇮🇳" },
  { iso: "PK", name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { iso: "BD", name: "Bangladesh", code: "+880", flag: "🇧🇩" },
  { iso: "LK", name: "Sri Lanka", code: "+94", flag: "🇱🇰" },
  { iso: "NP", name: "Nepal", code: "+977", flag: "🇳🇵" },
  { iso: "AE", name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { iso: "SA", name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { iso: "QA", name: "Qatar", code: "+974", flag: "🇶🇦" },
  { iso: "KW", name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { iso: "BH", name: "Bahrain", code: "+973", flag: "🇧🇭" },
  { iso: "OM", name: "Oman", code: "+968", flag: "🇴🇲" },
  { iso: "IL", name: "Israel", code: "+972", flag: "🇮🇱" },
  { iso: "JO", name: "Jordan", code: "+962", flag: "🇯🇴" },
  { iso: "LB", name: "Lebanon", code: "+961", flag: "🇱🇧" },
  { iso: "EG", name: "Egypt", code: "+20", flag: "🇪🇬" },
  { iso: "MA", name: "Morocco", code: "+212", flag: "🇲🇦" },
  { iso: "ZA", name: "South Africa", code: "+27", flag: "🇿🇦" },
  { iso: "KE", name: "Kenya", code: "+254", flag: "🇰🇪" },
  { iso: "NG", name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { iso: "SC", name: "Seychelles", code: "+248", flag: "🇸🇨" },
  { iso: "MU", name: "Mauritius", code: "+230", flag: "🇲🇺" },
  { iso: "MV", name: "Maldives", code: "+960", flag: "🇲🇻" },
  { iso: "CY", name: "Cyprus", code: "+357", flag: "🇨🇾" },
  { iso: "MT", name: "Malta", code: "+356", flag: "🇲🇹" },
  { iso: "IS", name: "Iceland", code: "+354", flag: "🇮🇸" },
  { iso: "HR", name: "Croatia", code: "+385", flag: "🇭🇷" },
  { iso: "SI", name: "Slovenia", code: "+386", flag: "🇸🇮" },
  { iso: "RS", name: "Serbia", code: "+381", flag: "🇷🇸" },
  { iso: "BA", name: "Bosnia and Herzegovina", code: "+387", flag: "🇧🇦" },
  { iso: "ME", name: "Montenegro", code: "+382", flag: "🇲🇪" },
  { iso: "MK", name: "North Macedonia", code: "+389", flag: "🇲🇰" },
  { iso: "AL", name: "Albania", code: "+355", flag: "🇦🇱" },
  { iso: "SK", name: "Slovakia", code: "+421", flag: "🇸🇰" },
  { iso: "LT", name: "Lithuania", code: "+370", flag: "🇱🇹" },
  { iso: "LV", name: "Latvia", code: "+371", flag: "🇱🇻" },
  { iso: "EE", name: "Estonia", code: "+372", flag: "🇪🇪" },
  { iso: "JM", name: "Jamaica", code: "+1876", flag: "🇯🇲" },
  { iso: "BB", name: "Barbados", code: "+1246", flag: "🇧🇧" },
  { iso: "TT", name: "Trinidad and Tobago", code: "+1868", flag: "🇹🇹" },
  { iso: "BS", name: "Bahamas", code: "+1242", flag: "🇧🇸" },
  { iso: "DO", name: "Dominican Republic", code: "+1809", flag: "🇩🇴" },
  { iso: "PR", name: "Puerto Rico", code: "+1787", flag: "🇵🇷" },
  { iso: "PA", name: "Panama", code: "+507", flag: "🇵🇦" },
  { iso: "CR", name: "Costa Rica", code: "+506", flag: "🇨🇷" },
  { iso: "LU", name: "Luxembourg", code: "+352", flag: "🇱🇺" },
  { iso: "MC", name: "Monaco", code: "+377", flag: "🇲🇨" },
];

// Try to detect user's country from timezone/locale
const detectUserCountry = () => {
  try {
    // Try to get from browser timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Common timezone to country mappings
    const timezoneMap = {
      'Europe/Sofia': 'BG',
      'Europe/London': 'GB',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Europe/Amsterdam': 'NL',
      'Europe/Brussels': 'BE',
      'Europe/Zurich': 'CH',
      'Europe/Vienna': 'AT',
      'Asia/Dubai': 'AE',
      'Asia/Singapore': 'SG',
      'Asia/Hong_Kong': 'HK',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Australia/Sydney': 'AU',
      'Pacific/Auckland': 'NZ',
    };
    
    if (timezoneMap[timezone]) {
      return timezoneMap[timezone];
    }
    
    // Try browser language
    const lang = navigator.language || navigator.userLanguage;
    if (lang) {
      const countryCode = lang.split('-')[1]?.toUpperCase();
      if (countryCode && COUNTRIES.find(c => c.iso === countryCode)) {
        return countryCode;
      }
    }
  } catch (e) {
    console.warn('Could not detect country:', e);
  }
  
  // Default fallback to Bulgaria as requested
  return 'BG';
};

export const PhoneInput = ({
  value = '',
  onChange,
  name = 'phone',
  placeholder = 'Phone number',
  required = false,
  dataTestId = 'phone-input'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize country on mount
  useEffect(() => {
    const detectedIso = detectUserCountry();
    const country = COUNTRIES.find(c => c.iso === detectedIso) || COUNTRIES.find(c => c.iso === 'BG');
    setSelectedCountry(country);
    
    // Parse existing value if provided
    if (value) {
      const matchingCountry = COUNTRIES.find(c => value.startsWith(c.code));
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        setPhoneNumber(value.replace(matchingCountry.code, '').trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country => {
    const searchLower = search.toLowerCase();
    return (
      country.name.toLowerCase().includes(searchLower) ||
      country.iso.toLowerCase().includes(searchLower) ||
      country.code.includes(search)
    );
  });

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    
    // Update parent with new full value
    const fullValue = `${country.code} ${phoneNumber}`.trim();
    onChange({
      target: {
        name,
        value: fullValue,
        countryCode: country.code,
        countryIso: country.iso,
        nationalNumber: phoneNumber
      }
    });
    
    // Focus back to phone input
    inputRef.current?.focus();
  };

  const handlePhoneChange = (e) => {
    const newNumber = e.target.value.replace(/[^\d\s-]/g, '');
    setPhoneNumber(newNumber);
    
    const fullValue = selectedCountry ? `${selectedCountry.code} ${newNumber}`.trim() : newNumber;
    onChange({
      target: {
        name,
        value: fullValue,
        countryCode: selectedCountry?.code,
        countryIso: selectedCountry?.iso,
        nationalNumber: newNumber
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        {/* Country Code Selector */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-sm hover:bg-slate-200 transition-colors min-w-[90px]"
          data-testid={`${dataTestId}-country-btn`}
        >
          <span className="text-lg">{selectedCountry?.flag}</span>
          <span className="text-sm font-medium text-slate-700">{selectedCountry?.code}</span>
          <CaretDown size={14} className="text-slate-500" />
        </button>
        
        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          className="input-field rounded-l-none flex-1"
          data-testid={dataTestId}
        />
      </div>

      {/* Country Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country, code, or +..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#d4af37]"
                autoFocus
                data-testid={`${dataTestId}-search`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          {/* Country List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.iso}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                    selectedCountry?.iso === country.iso ? 'bg-amber-50' : ''
                  }`}
                  data-testid={`${dataTestId}-country-${country.iso}`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="flex-1 text-sm text-slate-900">{country.name}</span>
                  <span className="text-sm text-slate-500 font-medium">{country.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
