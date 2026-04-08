import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck, ChartBar, Megaphone, CaretDown, CaretUp } from '@phosphor-icons/react';

const CONSENT_KEY = 'pt_cookie_consent';

// ── Consent helpers (importable by other modules e.g. GA) ────────────────────
export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hasConsented() {
  return getConsent() !== null;
}

export function analyticsAllowed() {
  return getConsent()?.analytics === true;
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${checked ? 'bg-[#d4af37]' : 'bg-slate-300'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CookieConsent() {
  const [visible, setVisible]       = useState(false);
  const [showPrefs, setShowPrefs]   = useState(false);
  const [analytics, setAnalytics]   = useState(false);
  const [marketing, setMarketing]   = useState(false);
  const [expanded, setExpanded]     = useState(null); // which category is open

  useEffect(() => {
    if (!hasConsented()) {
      // Small delay so it doesn't flash on initial paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (prefs) => {
    const consent = {
      essential: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      timestamp: new Date().toISOString(),
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch {}
    setVisible(false);
    setShowPrefs(false);
  };

  const acceptAll  = () => save({ analytics: true,  marketing: true  });
  const rejectAll  = () => save({ analytics: false, marketing: false });
  const savePrefs  = () => save({ analytics, marketing });

  if (!visible) return null;

  const categories = [
    {
      id: 'essential',
      icon: ShieldCheck,
      label: 'Strictly Necessary',
      desc: 'Required for the website to function — booking flow, session management, security. These cannot be disabled.',
      locked: true,
      value: true,
    },
    {
      id: 'analytics',
      icon: ChartBar,
      label: 'Analytics',
      desc: 'Help us understand how visitors use the site (e.g. Google Analytics). No personal data is sold.',
      locked: false,
      value: analytics,
      set: setAnalytics,
    },
    {
      id: 'marketing',
      icon: Megaphone,
      label: 'Marketing',
      desc: 'Used to show relevant ads and measure campaign performance. You can opt out at any time.',
      locked: false,
      value: marketing,
      set: setMarketing,
    },
  ];

  return (
    <>
      {/* ── Backdrop (prefs only) ── */}
      {showPrefs && (
        <div
          className="fixed inset-0 bg-black/40 z-[998] backdrop-blur-sm"
          onClick={() => setShowPrefs(false)}
        />
      )}

      {/* ── Preferences modal ── */}
      {showPrefs && (
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl"
          data-testid="cookie-prefs-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Cookie Preferences"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-['Playfair_Display'] text-lg font-semibold text-slate-900">Cookie Preferences</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage which cookies you allow</p>
            </div>
            <button
              onClick={() => setShowPrefs(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Categories */}
          <div className="px-6 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <cat.icon size={16} className="text-[#d4af37] flex-shrink-0" weight="fill" />
                  <span className="flex-1 text-sm font-medium text-slate-800">{cat.label}</span>
                  {expanded === cat.id
                    ? <CaretUp size={14} className="text-slate-400 flex-shrink-0" />
                    : <CaretDown size={14} className="text-slate-400 flex-shrink-0" />}
                  <div onClick={e => e.stopPropagation()}>
                    <Toggle
                      checked={cat.value}
                      onChange={cat.set || (() => {})}
                      disabled={cat.locked}
                    />
                  </div>
                </button>
                {expanded === cat.id && (
                  <div className="px-4 pb-3 pt-0">
                    <p className="text-xs text-slate-500 leading-relaxed pl-7">{cat.desc}</p>
                    {cat.locked && (
                      <p className="text-[10px] text-slate-400 mt-1 pl-7">Always active — cannot be disabled.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <button
              onClick={savePrefs}
              className="flex-1 bg-[#d4af37] text-slate-900 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#c9a430] transition-colors"
              data-testid="save-prefs-btn"
            >
              Save Preferences
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
              data-testid="accept-all-prefs-btn"
            >
              Accept All
            </button>
          </div>
        </div>
      )}

      {/* ── Banner ── */}
      {!showPrefs && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[997] bg-[#0f1419] border-t border-slate-700 shadow-2xl"
          data-testid="cookie-banner"
          role="region"
          aria-label="Cookie consent"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-snug">
                  We use cookies to ensure the booking experience works correctly and to understand how our site is used.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Read our{' '}
                  <Link to="/cookie-policy" className="text-[#d4af37] underline underline-offset-2 hover:text-[#c9a430]">
                    Cookie Policy
                  </Link>{' '}
                  for full details.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setShowPrefs(true); }}
                  className="text-xs text-slate-300 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                  data-testid="cookie-preferences-btn"
                >
                  Preferences
                </button>
                <button
                  onClick={rejectAll}
                  className="text-xs text-slate-300 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                  data-testid="cookie-reject-btn"
                >
                  Reject All
                </button>
                <button
                  onClick={acceptAll}
                  className="text-xs bg-[#d4af37] text-slate-900 font-semibold px-4 py-2 rounded-lg hover:bg-[#c9a430] transition-colors whitespace-nowrap"
                  data-testid="cookie-accept-btn"
                >
                  Accept All
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
