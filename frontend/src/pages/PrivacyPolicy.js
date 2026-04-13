import React from 'react';
import { CarSimple, ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'GBRoyaltransfers@gmail.com';
const EFFECTIVE_DATE = '1 April 2026';

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

export default function PrivacyPolicy() {
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
          <h1 className="font-['Playfair_Display'] text-4xl font-semibold mb-3">Privacy Policy</h1>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span>Effective Date: {EFFECTIVE_DATE}</span>
            <span>Website: https://planettransfers.online</span>
            <span>Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#d4af37] hover:underline">{CONTACT_EMAIL}</a></span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        <p className="text-slate-700 leading-relaxed mb-10 text-base bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          Planet Transfers ("we", "us", "our") operates as an intermediary platform facilitating airport transfer bookings through third-party providers.
          This Privacy Policy explains how we collect, use, and protect your personal data when you use our website.
        </p>

        <Section title="Information We Collect">
          <p>We may collect the following information:</p>
          <BulletList items={[
            'Full name',
            'Email address',
            'Phone number',
            'Pickup and drop-off locations',
            'Travel dates and times',
            'Passenger details',
            'Flight information (if provided)',
            'Payment-related information processed by third-party providers',
          ]} />
        </Section>

        <Section title="How We Use Your Information">
          <p>We use your data to:</p>
          <BulletList items={[
            'Process and manage your booking',
            'Communicate with you regarding your transfer',
            'Send booking confirmations and updates',
            'Provide customer support',
            'Improve our services and user experience',
          ]} />
        </Section>

        <Section title="Third-Party Providers">
          <p>
            We share your data with trusted third parties strictly for booking fulfilment, including:
          </p>
          <BulletList items={[
            'Transfer providers such as iWay and partners',
            'Email delivery services such as Resend',
            'Analytics services such as Google Analytics GA4',
          ]} />
          <p className="mt-3">
            Payments are processed by third-party providers. We do not store or process your full payment details.
          </p>
        </Section>

        <Section title="WhatsApp Communication">
          <p>
            If you contact us via WhatsApp, your phone number and messages may be used to provide support and booking assistance.
          </p>
        </Section>

        <Section title="Cookies and Tracking">
          <p>We use cookies to:</p>
          <BulletList items={[
            'Ensure website functionality',
            'Analyse user behaviour through Google Analytics',
            'Improve performance',
          ]} />
          <p className="mt-3">
            Tracking is only activated after user consent via our cookie banner.
          </p>
        </Section>

        <Section title="Data Retention">
          <p>We retain your data only as long as necessary to:</p>
          <BulletList items={[
            'Fulfil bookings',
            'Comply with legal obligations',
            'Resolve disputes',
          ]} />
        </Section>

        <Section title="Your Rights">
          <p>You have the right to:</p>
          <BulletList items={[
            'Access your personal data',
            'Request correction',
            'Request deletion',
            'Withdraw consent where applicable',
          ]} />
          <p className="mt-3">
            To exercise your rights, contact: <ContactLink />
          </p>
        </Section>

        <Section title="Data Security">
          <p>
            We implement appropriate technical and organisational measures to protect your data.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this policy from time to time. Any changes will be published on this page.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any privacy-related inquiries: <ContactLink />
          </p>
        </Section>

        {/* Related links */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4 font-medium">Related Legal Documents</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/terms-and-conditions" className="text-sm text-[#d4af37] hover:underline font-medium">Terms &amp; Conditions</Link>
            <Link to="/cookie-policy" className="text-sm text-[#d4af37] hover:underline font-medium">Cookie Policy</Link>
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
