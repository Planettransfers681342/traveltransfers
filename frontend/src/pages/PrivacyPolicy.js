import React from 'react';
import { CarSimple, ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CarSimple size={28} weight="fill" className="text-[#d4af37]" />
            <span className="font-['Playfair_Display'] text-xl font-semibold text-slate-900">Planet Transfers</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-semibold text-slate-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p>
            The Online Privacy Policy was developed to reaffirm our commitment to the information we collect from users 
            on PlanetTransfers.online. This policy covers the treatment that Planet Transfers gives to data that identifies 
            a user; whether the data is collected directly on the website or from other means of collection, such as customer 
            service or phone calls.
          </p>
          <p>
            The PlanetTransfers.online website contains links to other websites. We therefore recommend that, when redirected 
            to external pages, you consult the third party privacy policies before sending your personal data.
          </p>
          <p>
            This Privacy Policy will be subject to modifications. Therefore, a periodic review is recommended.
          </p>
          <p>
            We ask for your personal information to be able to book a transfer for you, and make sure you enjoy the best 
            possible service. In addition, we can use it to get in touch with you, or to send you our latest offers and 
            special promotions.
          </p>

          <h3>1. Planet Transfers Collects Personal Information When:</h3>
          <ul>
            <li>You register or make a booking on our website;</li>
            <li>You participate in our promotions or contests;</li>
            <li>When you contact us through our customer service channels.</li>
          </ul>
          <p>
            We may automatically save some data when you visit one of our platforms. Among this data can be your IP address, 
            what pages you have visited, what browser you are using and information on what elements you click on the page. 
            It can also include data about your computer's operating system, the version of the application, the language used, 
            specific configuration of the device and features.
          </p>
          <p>
            We may obtain personal data from social networks, partners, our transport operators, or other third parties. 
            For example, we work with affiliate partners that offer our services on other platforms. When making a booking 
            on one of the platforms of our partners they will send us the information related with your booking.
          </p>

          <h3>2. Acceptance of Privacy Policy</h3>
          <p>
            The user who decides to enter their personal data on our portal declares to know and accept our Privacy Policy. 
            All collected user information is secured through encrypted internet protocol. All the personal data collected 
            is incorporated into the Planet Transfers database.
          </p>

          <h3>3. How We Use Your Information</h3>
          <p>Planet Transfers uses the information collected for the following general purposes:</p>
          <ul>
            <li><strong>Reservations:</strong> We use your personal data to make and manage your reservations, and to send the necessary data to the transport operator that provides the transfer service.</li>
            <li><strong>Product Updates:</strong> Inform about new products and services of the company;</li>
            <li><strong>Registry Updates:</strong> Updating user registries;</li>
            <li><strong>Website Optimization:</strong> Optimize usability of our website;</li>
            <li><strong>Customer Support:</strong> Respond to the doubts and requests of our users;</li>
            <li><strong>Marketing:</strong> Carry out communication and marketing campaigns;</li>
            <li><strong>Communication:</strong> Communicate with our users;</li>
            <li><strong>Customer Feedback:</strong> We may use your information to send you a questionnaire about your reservation to help us better understand our clients and improve our service.</li>
            <li><strong>User Accounts:</strong> On our platforms it is possible to create user accounts to manage your reservations, enjoy special offers and manage your personal preferences.</li>
          </ul>
          <p>
            Access to the information collected is restricted to the employees and authorized third parties and service 
            providers of Planet Transfers. Those who use this information inappropriately will be subject to legal actions.
          </p>

          <h3>3.1 Use of Location Data (When Applicable)</h3>
          <p>
            If the user has granted the relevant permission, Planet Transfers may collect device location data in order to 
            provide features related to the booked service, such as determining pick-up points, estimating arrival times, 
            or validating proper service delivery.
          </p>
          <p>
            Location data is not shared with third parties except when strictly necessary to perform the service (for example, 
            with the transport operator responsible for the pickup), and it is not used for tracking purposes beyond the scope 
            of the service.
          </p>
          <p>
            The user may disable location access at any time via the device settings.
          </p>

          <h3>4. Third Parties We Share Your Data With</h3>
          <p>
            There are a certain number of companies involved in the services we provide, and we may share your personal data 
            with them in order to provide the service booked.
          </p>
          <p>
            <strong>TRANSFER OPERATORS:</strong> In order to process bookings your information will be transferred to our 
            transport operators and their collaborators. We will provide only the necessary information to process your 
            booking and never payment details or other sensitive information. This may include: lead passenger name, arrival 
            time and date, flight number, destination, phone number, email, extra services booked, and any other information 
            needed to process your booking.
          </p>
          <p>
            <strong>ASSOCIATES AND AFFILIATES:</strong> We work with multiple associated companies around the world. Some of 
            our partners offer or advertise our products. By making a reservation on one of these platforms, they will send 
            us some of the personal information you have provided them.
          </p>
          <p>
            <strong>COMPETENT AUTHORITIES:</strong> We may share your personal information with government or investigating 
            authorities if required by law, such as court orders, subpoenas, or other legal proceedings.
          </p>
          <p>
            <strong>THIRD-PARTY SERVICE PROVIDERS:</strong> We may use third-party services to process your personal data, 
            for example in our customer service department, or to send your reservation information to the transport operator. 
            These third parties are not authorized to use your personal data for any other purpose.
          </p>
          <p>
            <strong>PAYMENT PROCESSING:</strong> We work with third party service providers to manage payments. If you request 
            a refund, we may need to share certain reservation information with the payment service provider and the 
            corresponding financial entity.
          </p>

          <h3>5. Control Over Your Data</h3>
          <p>
            Unless judicially determined, the user's information registered on Planet Transfers platforms will never be used 
            for any purposes not specified in this agreement, nor will be transferred to third parties that are not authorized 
            partners or companies.
          </p>
          <p>
            The user guarantees the veracity and accuracy of the personal data provided. Planet Transfers will not be liable 
            in case of insertion of false or inaccurate data.
          </p>
          <p>
            The user may, at any time, amend or cancel their personal data by sending an email to privacy@planettransfers.online
          </p>
          <p>
            You may, at any time, exercise the rights of access, opposition, rectification or cancellation recognized in the 
            applicable data protection regulations.
          </p>

          <h3>6. Cookies</h3>
          <p>
            Planet Transfers also sends, receives and stores cookies. A cookie is a small amount of information which usually 
            includes a unique anonymous identifier. Please read our <Link to="/cookie-policy" className="text-[#d4af37] hover:underline">Cookie Policy</Link> for more information.
          </p>

          <h3>7. Data Controller</h3>
          <p>
            Planet Transfers Ltd controls the processing of personal data on its platforms and is committed to protecting 
            your privacy in accordance with applicable data protection laws.
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">Related Legal Documents:</p>
          <div className="flex gap-6">
            <Link to="/terms-conditions" className="text-sm text-[#d4af37] hover:underline">Terms & Conditions</Link>
            <Link to="/cookie-policy" className="text-sm text-[#d4af37] hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
