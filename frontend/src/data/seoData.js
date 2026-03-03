// SEO Destination and Route Data
// Easy to scale - just add more entries to these arrays

export const DESTINATIONS = [
  {
    slug: 'sofia',
    city: 'Sofia',
    country: 'Bulgaria',
    airport: 'Sofia Airport (SOF)',
    iataCode: 'SOF',
    title: 'Sofia Airport Transfer | Private Airport Transfers',
    description: 'Book a private airport transfer from Sofia Airport to your hotel or destination. Professional drivers, fixed pricing and reliable service.',
    heroImage: 'https://images.unsplash.com/photo-1555990538-1e8c9e2e1f57?w=1200',
    popularRoutes: ['Bansko', 'Plovdiv', 'Borovets', 'City Center'],
    distance: { center: '10 km', time: '20 min' },
    faqs: [
      { q: 'How far is Sofia Airport from the city center?', a: 'Sofia Airport is approximately 10 km from the city center, about 20-30 minutes by car depending on traffic.' },
      { q: 'Are there transfers available to ski resorts?', a: 'Yes, we offer transfers from Sofia Airport to popular ski resorts including Bansko, Borovets, and Pamporovo.' },
      { q: 'What vehicles are available?', a: 'We offer Standard sedans, Business class vehicles, minivans for groups, and coaches for large parties.' }
    ]
  },
  {
    slug: 'london',
    city: 'London',
    country: 'United Kingdom',
    airport: 'London Heathrow Airport (LHR)',
    iataCode: 'LHR',
    title: 'London Airport Transfer | Private Airport Transfers',
    description: 'Book a private airport transfer from London Heathrow, Gatwick, Stansted or Luton to your destination. Meet & greet service included.',
    heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
    popularRoutes: ['Central London', 'Oxford', 'Cambridge', 'Brighton'],
    distance: { center: '24 km', time: '45 min' },
    faqs: [
      { q: 'Which London airports do you serve?', a: 'We serve all London airports including Heathrow (LHR), Gatwick (LGW), Stansted (STN), Luton (LTN), and London City (LCY).' },
      { q: 'Is meet & greet service included?', a: 'Yes, our drivers will meet you in the arrivals hall with a name board and assist with your luggage.' },
      { q: 'How long does it take to reach Central London?', a: 'From Heathrow, it takes approximately 45-60 minutes to Central London depending on traffic.' }
    ]
  },
  {
    slug: 'paris',
    city: 'Paris',
    country: 'France',
    airport: 'Paris Charles de Gaulle Airport (CDG)',
    iataCode: 'CDG',
    title: 'Paris Airport Transfer | Private Airport Transfers',
    description: 'Book a private airport transfer from Paris CDG or Orly Airport to your hotel. Professional chauffeurs and comfortable vehicles.',
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    popularRoutes: ['Eiffel Tower', 'Champs-Élysées', 'Disneyland Paris', 'Versailles'],
    distance: { center: '25 km', time: '40 min' },
    faqs: [
      { q: 'Which Paris airports do you cover?', a: 'We provide transfers from both Charles de Gaulle (CDG) and Orly (ORY) airports.' },
      { q: 'Do you offer transfers to Disneyland Paris?', a: 'Yes, we offer direct transfers from Paris airports to Disneyland Paris, approximately 40 minutes from CDG.' },
      { q: 'Are child seats available?', a: 'Yes, child seats and booster seats are available upon request at no extra charge.' }
    ]
  },
  {
    slug: 'dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    airport: 'Dubai International Airport (DXB)',
    iataCode: 'DXB',
    title: 'Dubai Airport Transfer | Private Airport Transfers',
    description: 'Book a luxury private airport transfer from Dubai International Airport. Premium vehicles and professional chauffeurs.',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
    popularRoutes: ['Burj Khalifa', 'Palm Jumeirah', 'Dubai Marina', 'Abu Dhabi'],
    distance: { center: '15 km', time: '20 min' },
    faqs: [
      { q: 'How far is Dubai Airport from Downtown Dubai?', a: 'Dubai International Airport is approximately 15 km from Downtown Dubai, about 20-25 minutes by car.' },
      { q: 'Do you offer luxury vehicles?', a: 'Yes, we offer a range of luxury vehicles including Mercedes S-Class, BMW 7 Series, and luxury SUVs.' },
      { q: 'Are transfers available to Abu Dhabi?', a: 'Yes, we provide transfers from Dubai Airport to Abu Dhabi, approximately 1.5 hours journey.' }
    ]
  },
  {
    slug: 'zurich',
    city: 'Zurich',
    country: 'Switzerland',
    airport: 'Zurich Airport (ZRH)',
    iataCode: 'ZRH',
    title: 'Zurich Airport Transfer | Private Airport Transfers',
    description: 'Book a private airport transfer from Zurich Airport to your hotel or ski resort. Reliable service to all Swiss destinations.',
    heroImage: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1200',
    popularRoutes: ['St. Moritz', 'Zermatt', 'Lucerne', 'Interlaken'],
    distance: { center: '12 km', time: '15 min' },
    faqs: [
      { q: 'Do you offer transfers to Swiss ski resorts?', a: 'Yes, we provide transfers from Zurich Airport to all major Swiss ski resorts including St. Moritz, Zermatt, Verbier, and Davos.' },
      { q: 'How long does it take to reach St. Moritz?', a: 'The transfer from Zurich Airport to St. Moritz takes approximately 2.5-3 hours depending on road conditions.' },
      { q: 'Are winter tires mandatory?', a: 'Yes, all our vehicles are equipped with winter tires from November to April for safe travel in alpine conditions.' }
    ]
  }
];

export const ROUTES = [
  {
    slug: 'zurich-to-st-moritz',
    from: 'Zurich Airport',
    to: 'St. Moritz',
    fromCity: 'Zurich',
    toCity: 'St. Moritz',
    title: 'Zurich Airport to St. Moritz Transfer | Private Transfer',
    description: 'Book a private transfer from Zurich Airport to St. Moritz. Comfortable journey through the Swiss Alps with professional drivers.',
    distance: '200 km',
    duration: '2.5 - 3 hours',
    highlights: ['Scenic Alpine route', 'Professional drivers', 'Door-to-door service', 'Luggage assistance'],
    faqs: [
      { q: 'What is the best route from Zurich to St. Moritz?', a: 'We take the scenic route via the Julier Pass, offering stunning views of the Swiss Alps.' },
      { q: 'Can we make stops along the way?', a: 'Yes, we can arrange stops at scenic viewpoints or towns like Chur upon request.' }
    ]
  },
  {
    slug: 'sofia-airport-to-bansko',
    from: 'Sofia Airport',
    to: 'Bansko',
    fromCity: 'Sofia',
    toCity: 'Bansko',
    title: 'Sofia Airport to Bansko Transfer | Ski Resort Transfer',
    description: 'Book a private transfer from Sofia Airport to Bansko ski resort. Direct door-to-door service with comfortable vehicles.',
    distance: '160 km',
    duration: '2 - 2.5 hours',
    highlights: ['Direct to your hotel', 'Ski equipment transport', 'Professional drivers', '24/7 availability'],
    faqs: [
      { q: 'How long does it take from Sofia Airport to Bansko?', a: 'The journey takes approximately 2-2.5 hours depending on weather and traffic conditions.' },
      { q: 'Can you transport ski equipment?', a: 'Yes, our vehicles have space for ski and snowboard equipment at no extra charge.' }
    ]
  },
  {
    slug: 'paris-airport-to-disneyland',
    from: 'Paris CDG Airport',
    to: 'Disneyland Paris',
    fromCity: 'Paris',
    toCity: 'Disneyland Paris',
    title: 'Paris CDG to Disneyland Transfer | Private Transfer',
    description: 'Book a private transfer from Paris Charles de Gaulle Airport to Disneyland Paris. Family-friendly service with child seats available.',
    distance: '45 km',
    duration: '40 - 50 minutes',
    highlights: ['Child seats available', 'Meet & greet service', 'Direct to park entrance', 'Family-friendly drivers'],
    faqs: [
      { q: 'Do you provide child seats?', a: 'Yes, child seats and booster seats are available free of charge upon request.' },
      { q: 'Where will you drop us off at Disneyland?', a: 'We drop you directly at your Disneyland hotel or at the park entrance, whichever you prefer.' }
    ]
  }
];

// Helper function to get destination by slug
export const getDestinationBySlug = (slug) => {
  return DESTINATIONS.find(d => d.slug === slug);
};

// Helper function to get route by slug
export const getRouteBySlug = (slug) => {
  return ROUTES.find(r => r.slug === slug);
};

// Get all destination slugs for sitemap
export const getAllDestinationSlugs = () => {
  return DESTINATIONS.map(d => `/airport-transfer/${d.slug}`);
};

// Get all route slugs for sitemap
export const getAllRouteSlugs = () => {
  return ROUTES.map(r => `/transfer/${r.slug}`);
};

export default { DESTINATIONS, ROUTES };
