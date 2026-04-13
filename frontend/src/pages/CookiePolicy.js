import React from 'react';
import { CarSimple, ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'GBRoyaltransfers@gmail.com';

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-[#d4af37]/30">
        {title}
      </h2>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
      <div className="space-y-2 text-slate-700">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="list-disc pl-6 space-y-1.5 text-slate-700">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#d4af37] hover:underline font-medium">
      {CONTACT_EMAIL}
    </a>
  );
}

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#d4af37] text-xs uppercase tracking-widest font-semibold mb-3">Legal</p>
          <h1 className="font-['Playfair_Display'] text-4xl font-semibold mb-3">Cookie Policy</h1>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span>Website: https://planettransfers.online</span>
            <span>Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#d4af37] hover:underline">{CONTACT_EMAIL}</a></span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        <Section title="What Are Cookies">
          <p>
            Cookies are small text files stored on your device when you visit our website.
          </p>
        </Section>

        <Section title="How We Use Cookies">
          <p>We use cookies to:</p>
          <BulletList items={[
            'Ensure proper website functionality',
            'Remember your preferences',
            'Analyse website usage through Google Analytics',
            'Improve site performance and user experience',
          ]} />
        </Section>

        <Section title="Types of Cookies We Use">
          <SubSection title="Essential Cookies">
            <p>
              These are required for the basic operation of the website and cannot be disabled.
            </p>
          </SubSection>

          <SubSection title="Analytics Cookies">
            <p>
              These help us understand how visitors use the website so we can improve it.
            </p>
          </SubSection>

          <SubSection title="Marketing Cookies">
            <p>
              These may be used for marketing or advertising purposes if enabled in future.
            </p>
          </SubSection>
        </Section>

        <Section title="Consent">
          <p>When you visit our website, you can:</p>
          <BulletList items={[
            'Accept all cookies',
            'Reject non-essential cookies',
            'Manage your preferences',
          ]} />
          <p className="mt-3">
            No non-essential tracking should be activated without user consent.
          </p>
        </Section>

        <Section title="Managing Cookies">
          <p>
            Users can change their cookie preferences at any time through the cookie banner or browser settings.
          </p>
        </Section>

        <Section title="Third-Party Cookies">
          <p>
            We use third-party services such as Google Analytics GA4, which may collect anonymised usage data in accordance with user consent.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any questions about cookies or privacy: <ContactLink />
          </p>
        </Section>

        {/* Related links */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4 font-medium">Related Legal Documents</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/terms-and-conditions" className="text-sm text-[#d4af37] hover:underline font-medium">Terms &amp; Conditions</Link>
            <Link to="/privacy-policy" className="text-sm text-[#d4af37] hover:underline font-medium">Privacy Policy</Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 mt-8">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Planet Transfers · All rights reserved</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-600 transition-colors">{CONTACT_EMAIL}</a>
        </div>
      </footer>
    </div>
  );
}
