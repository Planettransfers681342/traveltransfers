import React, { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { useCurrency } from '../context/CurrencyContext';

export function CurrencySelector() {
  const { currency, setCurrency, current, currencies } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        data-testid="currency-selector-btn"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-sm font-semibold text-slate-700 shadow-sm"
      >
        <span className="text-[17px] leading-none">{current.flag}</span>
        <span className="tracking-wide">{current.code}</span>
        <CaretDown
          size={11}
          weight="bold"
          className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          data-testid="currency-dropdown"
          className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ minWidth: '120px' }}
        >
          {currencies.map(c => (
            <button
              key={c.code}
              data-testid={`currency-option-${c.code}`}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                c.code === currency
                  ? 'bg-[#d4af37]/10 text-[#b8962e] font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-[17px] leading-none">{c.flag}</span>
              <span className="font-semibold tracking-wide">{c.code}</span>
              <span className="text-slate-400 font-normal">{c.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
