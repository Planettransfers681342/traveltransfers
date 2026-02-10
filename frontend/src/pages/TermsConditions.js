import React from 'react';
import { CarSimple, ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
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
        <h1 className="text-4xl font-semibold text-slate-900 mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-slate max-w-none">
          <h3>1. Purpose of the Contract</h3>
          <p>
            www.PlanetTransfers.online is the property of Planet Transfers Ltd, a company registered and operating 
            as a professional airport transfer service provider.
          </p>
          <p>
            These general conditions will regulate the contractual relationship between www.PlanetTransfers.online 
            (or "Planet Transfers") and the client (you), by virtue of which Planet Transfers acts as the disclosed 
            agent of the supplier.
          </p>
          <p>
            For the provision of our services we work with private transport operators (or "Suppliers") who provide 
            professional transport services for the transfer of passengers, or who act as an agency with legal capacity 
            to offer transport services and who are in possession of all the necessary licenses and permits according 
            to the legislation applicable to each one of them.
          </p>
          <p>
            By booking on our website, you agree that the contract for the use and provision of the service is between 
            you and our provider (the provider of the service). You agree to be bound by these terms and conditions as 
            well as other information contained on the website.
          </p>
          <p>
            By making a reservation you confirm that you have read these Terms and Conditions and that you have the legal 
            capacity to accept them on your own behalf and on behalf of all passengers using the services.
          </p>

          <h3>2. The Booking Process: Payment and Contract</h3>
          <p>
            Bookings can be made online on our website or by phone. If the booking is made for two or more people, 
            the person making the booking ("the Lead Party") is considered to have done so on behalf of all the passengers 
            and he or she accepts these terms and conditions on behalf of any passenger of the party. The Lead Party must 
            be at least 18 years of age.
          </p>
          <p>
            Full payment is required at the time of booking. On receipt of full payment, Planet Transfers will process the 
            booking and after confirmation will send to the Lead Party the transfer services details which you have booked 
            and the booking voucher. The voucher acts as 'ticket' and must be presented to the supplier representative or driver.
          </p>
          <p>
            When booking is confirmed a legally binding contract will be created between the Lead Party (and all of the 
            passengers listed on the booking) and the supplier. No binding contract is created until full payment has been 
            received.
          </p>
          <p>
            Planet Transfers or its suppliers cannot be held responsible or liable for timeliness, accuracy or quality of 
            the services due to incorrect information provided at the time you book the service. It is the Lead Party's 
            responsibility to check that all the details of the booking are correct prior to travel.
          </p>

          <h3>3. Child Seats</h3>
          <p>
            Please ensure that you are aware of the local legislation when travelling with children. In some destinations 
            children must use appropriate child seats. You are responsible for correctly providing all the information of 
            the passengers at the time of booking and in case of traveling with children choose the necessary extras to 
            adapt to the legislation of the country where you have booked the service.
          </p>
          <p>
            The Lead Party is responsible to check that the retention system is compatible with the vehicle and that it is 
            correctly installed. Planet Transfers or our suppliers will not be responsible for any incident derived from 
            misuse, or improper installation of the retention system.
          </p>

          <h3>4. Child Pricing</h3>
          <p>
            All children and babies, regardless of their age, will be taken into account to determine the capacity of the 
            vehicle to use, and therefore must be entered in the total number of passengers at the time of booking.
          </p>

          <h3>5. Disabled Passengers</h3>
          <p>
            In some destinations, Planet Transfers, through its suppliers, offers transportation services for people with 
            disabilities or reduced mobility. In case of booking a vehicle of these characteristics you are responsible 
            that the reserved vehicle perfectly adapts to the needs of the people traveling in it. We recommend contacting 
            our customer service department before booking a vehicle of this kind.
          </p>

          <h3>6. Amendments</h3>
          <p>
            Booking modifications can be made free of charge up to 24 hours before the use of the first service included 
            in any reservation confirmed by us. Modifications may incur additional charges and, if so, you must pay these 
            charges before any changes are made. Only pick-up and drop-off times and extras can be modified.
          </p>

          <h3>7. Cancellations</h3>
          <p>
            Cancellations must be made through our website or by contacting us directly. If you cancel your booking more 
            than 24 hours before the date you use the first confirmed service in your reservation, you will receive a full 
            refund. If you cancel your booking less than 24 hours before the date you use the first confirmed service in 
            your reservation, you will not be entitled to any refund.
          </p>
          <p>
            If you do not use the services for any reason and do not cancel the booking, no refunds will be provided. All 
            refunds will be credited to the original payment method and account used at the time of booking.
          </p>
          <h4>7.1 Cancellations by Us</h4>
          <p>
            In extraordinary cases, and if our supplier is forced to make a significant change in the conditions of service, 
            or to cancel the service, we will make the necessary efforts to find viable alternatives to any confirmed 
            reservation that we must cancel. If we are finally forced to cancel your reservation, you will be refunded 
            the full amount of the reservation.
          </p>

          <h3>8. Vehicles Booked</h3>
          <p>
            We try hard to respect our clients' preferences about the vehicle chosen; however, the vehicle may be replaced 
            by one of higher capacity or multiple vehicles depending on availability. If the change is a reduction in the 
            category or size of the vehicle for which we have a cheaper rate, the price difference will be refunded.
          </p>
          <p>
            All vehicles provided by the suppliers are fully insured for passenger and third-party claims, as required by 
            the local law.
          </p>

          <h3>9. Luggage</h3>
          <p>
            The vehicles used for private transfers have capacity for at least 1 medium suitcase per passenger seat which 
            should not exceed 70cm x 50cm. At the time of booking you must inform us of the luggage to be transported. 
            The passenger will be responsible for any costs incurred in case of needing additional vehicles for the 
            transport of undeclared luggage.
          </p>
          <p>
            Unless you travel with a guide dog, animals are not allowed. The transport of luggage and other personal items 
            is at your own risk and neither Planet Transfers nor our supplier will be liable for any damages or losses.
          </p>

          <h3>10. Services</h3>
          <p>
            We offer private Transfer Services. We cannot guarantee the exact itinerary to your destination and all the 
            information given on our website, such as route maps, are for informative purposes only. We strive to ensure 
            that the pick-up and drop-off hours are respected but we cannot guarantee them.
          </p>
          <p>
            In case you don't find the driver please call the supplier immediately. You can find the supplier's phone 
            number on your transfer voucher. If you organize alternative transport without communicating it to us the 
            supplier will be released from its obligation to provide the service and no amount will be refunded.
          </p>
          <p>
            If the flight, ship or train arrival is more than 45 minutes late than the time confirmed in your booking, 
            our supplier will wait for you, but cannot guarantee the service under these circumstances.
          </p>

          <h3>11. Your Responsibility</h3>
          <p>Formalizing this contract, you implicitly declare that:</p>
          <ol>
            <li>You are over 18 years of age and are in full use of your mental faculties and that you are therefore qualified to assume the legal responsibilities derived from this agreement.</li>
            <li>You declare that the credit or debit cards used for making the booking are owned by you and that they have sufficient funds to cover the total booking amounts.</li>
            <li>You understand that you must notify us as soon as possible of any modification of the data you have provided.</li>
            <li>You are responsible for providing the necessary documentation for crossing borders.</li>
            <li>You are responsible to check the established pick up time and make sure you arrive at the airport, station or port with enough time to check in.</li>
          </ol>

          <h3>12. Our Responsibility</h3>
          <p>
            In the case of breach of these conditions we will be liable only for those damages or losses that are a 
            consequence attributable to our default or our negligence, and at most for the total amount paid by you. 
            We are not liable for damages that are not directly attributable to us or those caused by accident, force 
            majeure or that are caused by legal or administrative requirements.
          </p>
          <p>
            We cannot be held responsible in the event that the fulfilment of our obligations is impeded or affected 
            directly or indirectly by force majeure events including extreme weather events, natural disasters, terrorism, 
            accidents, police controls, extraordinary traffic congestion or strikes.
          </p>

          <h3>13. Complaints</h3>
          <p>
            If the service you receive from our partner does not meet your expectations, you should immediately notify 
            our Customer Service and, whenever possible, at the time the incident occurs. You should firstly contact the 
            local supplier using the number provided in the booking confirmation.
          </p>
          <p>
            Complaints in writing must be sent by email to support@planettransfers.online at the latest 28 days after 
            your return date.
          </p>

          <h3>14. Passenger Conduct</h3>
          <p>
            By formalizing this contract, you tacitly grant the company and the supplier the right to refuse service to 
            any passenger who, according to the driver's criteria, is under the influence of alcohol or drugs, or whose 
            conduct may be considered dangerous to the driver, third parties or themselves.
          </p>
          <p>
            Alcoholic beverages and narcotics are not allowed in the supplier's vehicles. Smoking or eating inside the 
            vehicle is not allowed.
          </p>

          <h3>15. Travel Insurance</h3>
          <p>
            It is your responsibility to ensure that the insurance cover you have purchased is suitable for your particular 
            needs. We strongly advise you to read your insurance policy details carefully.
          </p>

          <h3>16. Jurisdiction</h3>
          <p>
            These General Conditions will be governed by the applicable law in the jurisdiction where Planet Transfers 
            operates. Disputes or claims arising in connection with these terms and conditions shall be subject to the 
            appropriate jurisdiction.
          </p>

          <h3>17. Privacy</h3>
          <p>
            The Online Privacy Policy was developed to reaffirm our commitment to the information we collect from users. 
            For more information please read our <Link to="/privacy-policy" className="text-[#d4af37] hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">Related Legal Documents:</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-sm text-[#d4af37] hover:underline">Privacy Policy</Link>
            <Link to="/cookie-policy" className="text-sm text-[#d4af37] hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
