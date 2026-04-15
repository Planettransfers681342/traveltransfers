import React, { createContext, useContext, useState } from 'react';

export const CURRENCIES = [
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('pt_currency') || 'GBP';
  });

  const setCurrency = (code) => {
    localStorage.setItem('pt_currency', code);
    setCurrencyState(code);
  };

  const current = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, current, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
