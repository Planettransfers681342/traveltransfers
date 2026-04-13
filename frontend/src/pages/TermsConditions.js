import React from 'react';
import { CarSimple, ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'GBRoyaltransfers@gmail.com';
const EFFECTIVE_DATE = '1 April 2026';

function Section({ num, title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-[#d4af37]/30 flex items-baseline gap-2">
        {num && <span className="text-[#d4af37] font-bold">{num}.</span>}
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

export default function TermsConditions() {
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
          <h1 className="font-['Playfair_Display'] text-4xl font-semibold mb-3">Terms &amp; Conditions</h1>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span>Effective Date: {EFFECTIVE_DATE}</span>
            <span>Website: https://planettransfers.online</span>
            <span>Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#d4af37] hover:underline">{CONTACT_EMAIL}</a></span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        <Section num="1" title="Role of Planet Transfers">
          <p>
            Planet Transfers acts solely as an intermediary platform connecting customers with independent third-party transfer providers.
          </p>
          <p>
            We are not the transport provider and do not operate vehicles ourselves.
          </p>
        </Section>

        <Section num="2" title="Booking Process">
          <p>By making a booking:</p>
          <BulletList items={[
            'You enter into a contract with the transfer provider',
            'Payment is processed by the provider or its partners',
            'We facilitate the booking process only',
          ]} />
        </Section>

        <Section num="3" title="Prices and Payments">
          <BulletList items={[
            'All prices are displayed before payment',
            'Payments are processed via third-party providers',
            'We are not responsible for payment processing errors caused by third-party systems',
          ]} />
        </Section>

        <Section num="4" title="Cancellation Policy">
          <BulletList items={[
            'Free cancellation is available up to 48 hours before the scheduled pickup time',
            'Cancellation requests within 48 hours may not be refunded',
            'Refunds are subject to the supplier\'s terms and conditions',
          ]} />
        </Section>

        <Section num="5" title="Modification Policy">
          <BulletList items={[
            'Modifications are allowed up to 48 hours before pickup time',
            'Changes are subject to availability',
            'Last-minute changes may not be possible',
          ]} />
        </Section>

        <Section num="6" title="Passenger Responsibilities">
          <p>Passengers must:</p>
          <BulletList items={[
            'Provide a valid mobile phone number',
            'Ensure the phone is switched on and accessible, including data connection where applicable',
            'Be reachable by the driver at all times',
          ]} />
          <p className="mt-3">
            If you cannot locate your driver, you must contact the emergency phone number provided in your booking confirmation.
          </p>
        </Section>

        <Section num="7" title="Delays, Missed Flights, and Additional Costs">
          <p>We are not responsible for:</p>
          <BulletList items={[
            'Missed flights',
            'Missed connections',
            'Additional costs or payments caused by delayed or missed transfer services',
          ]} />
          <p className="mt-3">
            In such cases, any liability is strictly limited to the amount paid for the booked transfer service only.
          </p>
        </Section>

        <Section num="8" title="Liability">
          <p>Planet Transfers is not liable for:</p>
          <BulletList items={[
            'Service quality provided by third-party suppliers',
            'Delays, cancellations, or driver issues caused by third-party providers',
            'Any indirect, consequential, or additional damages',
          ]} />
          <p className="mt-3">
            Our responsibility is limited to the amount paid for the booked service.
          </p>
        </Section>

        <Section num="9" title="Force Majeure">
          <p>We are not liable for events beyond our control, including but not limited to:</p>
          <BulletList items={[
            'Severe weather conditions',
            'Traffic incidents',
            'Strikes',
            'Road closures',
            'Natural disasters',
            'Other unforeseeable events affecting the service',
          ]} />
        </Section>

        <Section num="10" title="Complaints">
          <p>
            If the service you receive from our partner does not meet your expectations, you should immediately notify our Customer Service and, whenever possible, at the time the incident occurs.
          </p>
          <p>
            You should firstly contact the local supplier using the number provided in the booking confirmation.
          </p>
          <p>
            Complaints in writing must be sent by email to <ContactLink /> no later than 14 days after your return date.
          </p>
        </Section>

        <Section num="11" title="Governing Law">
          <p>
            These terms are governed by applicable laws and regulations relevant to the service and jurisdiction.
          </p>
        </Section>

        <Section num="12" title="Contact">
          <p>
            For any questions regarding these Terms &amp; Conditions: <ContactLink />
          </p>
        </Section>

        {/* Related links */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4 font-medium">Related Legal Documents</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/privacy-policy" className="text-sm text-[#d4af37] hover:underline font-medium">Privacy Policy</Link>
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
