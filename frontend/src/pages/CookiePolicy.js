import React from 'react';
import { CarSimple, ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export default function CookiePolicy() {
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
        <h1 className="text-4xl font-semibold text-slate-900 mb-8">Cookie Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p>
            This Cookie Policy explains what cookies are, how Planet Transfers uses cookies on our website 
            (www.planettransfers.online), and your choices regarding cookies.
          </p>

          <h3>What Are Cookies?</h3>
          <p>
            Cookies are small text files that are stored on your computer or mobile device when you visit a website. 
            They are widely used to make websites work more efficiently and provide information to website owners. 
            Cookies allow the website to recognize your device and remember certain information about your preferences 
            or past actions.
          </p>

          <h3>How We Use Cookies</h3>
          <p>
            Planet Transfers uses cookies and similar tracking technologies to track activity on our website and hold 
            certain information. We use cookies for the following purposes:
          </p>

          <h4>Essential Cookies</h4>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as 
            security, network management, and account access. You cannot opt out of these cookies as the website 
            cannot function properly without them.
          </p>
          <ul>
            <li><strong>Session cookies:</strong> These temporary cookies expire when you close your browser and are used to maintain your session while you navigate our website.</li>
            <li><strong>Authentication cookies:</strong> These help us identify you when you log in to make a booking or access your account.</li>
            <li><strong>Security cookies:</strong> These help protect your data and prevent fraudulent use of login credentials.</li>
          </ul>

          <h4>Performance & Analytics Cookies</h4>
          <p>
            These cookies allow us to count visits and traffic sources so we can measure and improve the performance 
            of our site. They help us know which pages are the most and least popular and see how visitors move around 
            the site.
          </p>
          <ul>
            <li><strong>Analytics cookies:</strong> We use these to understand how visitors interact with our website, helping us improve functionality and user experience.</li>
            <li><strong>Performance cookies:</strong> These collect information about how you use our website, such as which pages you visit most often.</li>
          </ul>

          <h4>Functionality Cookies</h4>
          <p>
            These cookies enable enhanced functionality and personalization. They may be set by us or by third-party 
            providers whose services we have added to our pages.
          </p>
          <ul>
            <li><strong>Preference cookies:</strong> These remember your preferences such as language, region, and other customizable elements.</li>
            <li><strong>Feature cookies:</strong> These enable specific website features that you have chosen to use.</li>
          </ul>

          <h4>Marketing & Advertising Cookies</h4>
          <p>
            These cookies are used to track visitors across websites. The intention is to display ads that are relevant 
            and engaging for the individual user.
          </p>
          <ul>
            <li><strong>Targeting cookies:</strong> These track your browsing habits to enable us to show advertising which is more likely to be of interest to you.</li>
            <li><strong>Social media cookies:</strong> These allow you to share content directly on social media platforms.</li>
          </ul>

          <h3>Third-Party Cookies</h3>
          <p>
            In addition to our own cookies, we may also use various third-party cookies to report usage statistics of 
            the website and deliver advertisements on and through the website. These third parties include:
          </p>
          <ul>
            <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
            <li><strong>Stripe:</strong> For secure payment processing</li>
            <li><strong>Social Media Platforms:</strong> For social sharing functionality</li>
          </ul>

          <h3>Managing Your Cookie Preferences</h3>
          <p>
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit 
            the ability of websites to set cookies, you may worsen your overall user experience, since it will no 
            longer be personalized to you.
          </p>
          <p>
            You can manage your cookie preferences in the following ways:
          </p>
          <ul>
            <li><strong>Browser settings:</strong> You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies.</li>
            <li><strong>Deleting cookies:</strong> You can delete cookies that have already been set.</li>
            <li><strong>Private browsing:</strong> You can use private or incognito mode in your browser.</li>
          </ul>

          <h4>Browser-Specific Instructions:</h4>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
          </ul>

          <h3>Cookie Retention</h3>
          <p>
            The length of time a cookie will remain on your device depends on whether it is a "persistent" or "session" 
            cookie. Session cookies will only remain on your device until you stop browsing. Persistent cookies remain 
            on your device until they expire or are deleted.
          </p>
          <table className="w-full border-collapse border border-slate-300 my-6">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 p-3 text-left">Cookie Type</th>
                <th className="border border-slate-300 p-3 text-left">Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3">Session Cookies</td>
                <td className="border border-slate-300 p-3">Deleted when browser is closed</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3">Authentication Cookies</td>
                <td className="border border-slate-300 p-3">Up to 30 days</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3">Analytics Cookies</td>
                <td className="border border-slate-300 p-3">Up to 2 years</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3">Marketing Cookies</td>
                <td className="border border-slate-300 p-3">Up to 1 year</td>
              </tr>
            </tbody>
          </table>

          <h3>Updates to This Policy</h3>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices or for other 
            operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed 
            about our use of cookies.
          </p>

          <h3>Contact Us</h3>
          <p>
            If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@planettransfers.online</li>
            <li>WhatsApp: +44 773 947 6432</li>
          </ul>

          <p className="text-sm text-slate-500 mt-8">
            Last updated: February 2026
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">Related Legal Documents:</p>
          <div className="flex gap-6">
            <Link to="/terms-conditions" className="text-sm text-[#d4af37] hover:underline">Terms & Conditions</Link>
            <Link to="/privacy-policy" className="text-sm text-[#d4af37] hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
