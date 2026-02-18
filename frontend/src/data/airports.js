// Top 500+ Global Airports with IATA codes
// Includes major international airports, regional hubs, and common aliases

export const AIRPORTS = [
  // United Kingdom
  { iata: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom", aliases: ["heathrow", "london heathrow", "lhr"] },
  { iata: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom", aliases: ["gatwick", "london gatwick", "lgw"] },
  { iata: "STN", name: "London Stansted Airport", city: "London", country: "United Kingdom", aliases: ["stansted", "london stansted", "stn"] },
  { iata: "LTN", name: "London Luton Airport", city: "London", country: "United Kingdom", aliases: ["luton", "london luton", "ltn"] },
  { iata: "LCY", name: "London City Airport", city: "London", country: "United Kingdom", aliases: ["city airport", "london city", "lcy"] },
  { iata: "SEN", name: "London Southend Airport", city: "London", country: "United Kingdom", aliases: ["southend", "london southend", "sen"] },
  { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", aliases: ["manchester", "man"] },
  { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", aliases: ["birmingham", "bhx"] },
  { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", aliases: ["edinburgh", "edi"] },
  { iata: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", aliases: ["glasgow", "gla"] },
  { iata: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", aliases: ["bristol", "brs"] },
  { iata: "NCL", name: "Newcastle Airport", city: "Newcastle", country: "United Kingdom", aliases: ["newcastle", "ncl"] },
  { iata: "LPL", name: "Liverpool John Lennon Airport", city: "Liverpool", country: "United Kingdom", aliases: ["liverpool", "lpl"] },
  { iata: "BFS", name: "Belfast International Airport", city: "Belfast", country: "United Kingdom", aliases: ["belfast", "bfs"] },
  { iata: "LBA", name: "Leeds Bradford Airport", city: "Leeds", country: "United Kingdom", aliases: ["leeds", "bradford", "lba"] },
  { iata: "EMA", name: "East Midlands Airport", city: "Nottingham", country: "United Kingdom", aliases: ["east midlands", "ema"] },
  { iata: "ABZ", name: "Aberdeen Airport", city: "Aberdeen", country: "United Kingdom", aliases: ["aberdeen", "abz"] },
  { iata: "CWL", name: "Cardiff Airport", city: "Cardiff", country: "United Kingdom", aliases: ["cardiff", "cwl"] },
  
  // United States - Major Hubs
  { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", aliases: ["jfk", "kennedy", "new york jfk"] },
  { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States", aliases: ["lax", "los angeles", "la airport"] },
  { iata: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "United States", aliases: ["ord", "ohare", "chicago ohare"] },
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "United States", aliases: ["atl", "atlanta", "hartsfield"] },
  { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States", aliases: ["dfw", "dallas", "fort worth"] },
  { iata: "DEN", name: "Denver International Airport", city: "Denver", country: "United States", aliases: ["den", "denver", "dia"] },
  { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States", aliases: ["sfo", "san francisco", "sf airport"] },
  { iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "United States", aliases: ["sea", "seattle", "seatac"] },
  { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "United States", aliases: ["mia", "miami"] },
  { iata: "MCO", name: "Orlando International Airport", city: "Orlando", country: "United States", aliases: ["mco", "orlando"] },
  { iata: "EWR", name: "Newark Liberty International Airport", city: "Newark", country: "United States", aliases: ["ewr", "newark", "liberty"] },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", aliases: ["lga", "laguardia", "la guardia"] },
  { iata: "BOS", name: "Boston Logan International Airport", city: "Boston", country: "United States", aliases: ["bos", "boston", "logan"] },
  { iata: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "United States", aliases: ["phx", "phoenix", "sky harbor"] },
  { iata: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", country: "United States", aliases: ["iah", "houston", "bush intercontinental"] },
  { iata: "LAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "United States", aliases: ["las", "las vegas", "vegas", "mccarran"] },
  { iata: "MSP", name: "Minneapolis-Saint Paul International Airport", city: "Minneapolis", country: "United States", aliases: ["msp", "minneapolis", "st paul"] },
  { iata: "DTW", name: "Detroit Metropolitan Airport", city: "Detroit", country: "United States", aliases: ["dtw", "detroit", "metro"] },
  { iata: "PHL", name: "Philadelphia International Airport", city: "Philadelphia", country: "United States", aliases: ["phl", "philadelphia", "philly"] },
  { iata: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", country: "United States", aliases: ["clt", "charlotte"] },
  { iata: "SAN", name: "San Diego International Airport", city: "San Diego", country: "United States", aliases: ["san", "san diego"] },
  { iata: "TPA", name: "Tampa International Airport", city: "Tampa", country: "United States", aliases: ["tpa", "tampa"] },
  { iata: "IAD", name: "Washington Dulles International Airport", city: "Washington D.C.", country: "United States", aliases: ["iad", "dulles", "washington dulles"] },
  { iata: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington D.C.", country: "United States", aliases: ["dca", "reagan", "national"] },
  { iata: "BWI", name: "Baltimore/Washington International Airport", city: "Baltimore", country: "United States", aliases: ["bwi", "baltimore", "baltimore washington"] },
  { iata: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", country: "United States", aliases: ["hnl", "honolulu", "hawaii"] },
  { iata: "PDX", name: "Portland International Airport", city: "Portland", country: "United States", aliases: ["pdx", "portland"] },
  { iata: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City", country: "United States", aliases: ["slc", "salt lake city", "salt lake"] },
  { iata: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", country: "United States", aliases: ["aus", "austin"] },
  { iata: "RDU", name: "Raleigh-Durham International Airport", city: "Raleigh", country: "United States", aliases: ["rdu", "raleigh", "durham"] },
  { iata: "SJC", name: "San Jose International Airport", city: "San Jose", country: "United States", aliases: ["sjc", "san jose"] },
  { iata: "OAK", name: "Oakland International Airport", city: "Oakland", country: "United States", aliases: ["oak", "oakland"] },
  
  // Europe - Major Airports
  { iata: "CDG", name: "Paris Charles de Gaulle Airport", city: "Paris", country: "France", aliases: ["cdg", "charles de gaulle", "paris cdg", "roissy"] },
  { iata: "ORY", name: "Paris Orly Airport", city: "Paris", country: "France", aliases: ["ory", "orly", "paris orly"] },
  { iata: "AMS", name: "Amsterdam Schiphol Airport", city: "Amsterdam", country: "Netherlands", aliases: ["ams", "schiphol", "amsterdam"] },
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", aliases: ["fra", "frankfurt"] },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", aliases: ["muc", "munich", "munchen"] },
  { iata: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany", aliases: ["dus", "dusseldorf", "duesseldorf"] },
  { iata: "TXL", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", aliases: ["ber", "berlin", "brandenburg"] },
  { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany", aliases: ["ham", "hamburg"] },
  { iata: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", aliases: ["cgn", "cologne", "bonn", "koln"] },
  { iata: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "Germany", aliases: ["str", "stuttgart"] },
  { iata: "MAD", name: "Adolfo Suárez Madrid-Barajas Airport", city: "Madrid", country: "Spain", aliases: ["mad", "madrid", "barajas"] },
  { iata: "BCN", name: "Barcelona-El Prat Airport", city: "Barcelona", country: "Spain", aliases: ["bcn", "barcelona", "el prat"] },
  { iata: "PMI", name: "Palma de Mallorca Airport", city: "Palma de Mallorca", country: "Spain", aliases: ["pmi", "palma", "mallorca", "majorca"] },
  { iata: "AGP", name: "Málaga-Costa del Sol Airport", city: "Málaga", country: "Spain", aliases: ["agp", "malaga", "costa del sol"] },
  { iata: "ALC", name: "Alicante-Elche Airport", city: "Alicante", country: "Spain", aliases: ["alc", "alicante", "elche"] },
  { iata: "IBZ", name: "Ibiza Airport", city: "Ibiza", country: "Spain", aliases: ["ibz", "ibiza"] },
  { iata: "FCO", name: "Rome Fiumicino Airport", city: "Rome", country: "Italy", aliases: ["fco", "fiumicino", "rome", "leonardo da vinci"] },
  { iata: "CIA", name: "Rome Ciampino Airport", city: "Rome", country: "Italy", aliases: ["cia", "ciampino", "rome ciampino"] },
  { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy", aliases: ["mxp", "malpensa", "milan"] },
  { iata: "LIN", name: "Milan Linate Airport", city: "Milan", country: "Italy", aliases: ["lin", "linate", "milan linate"] },
  { iata: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "Italy", aliases: ["vce", "venice", "marco polo"] },
  { iata: "NAP", name: "Naples International Airport", city: "Naples", country: "Italy", aliases: ["nap", "naples", "napoli"] },
  { iata: "BLQ", name: "Bologna Airport", city: "Bologna", country: "Italy", aliases: ["blq", "bologna"] },
  { iata: "FLR", name: "Florence Airport", city: "Florence", country: "Italy", aliases: ["flr", "florence", "firenze"] },
  { iata: "PSA", name: "Pisa International Airport", city: "Pisa", country: "Italy", aliases: ["psa", "pisa", "galileo galilei"] },
  { iata: "LIS", name: "Lisbon Portela Airport", city: "Lisbon", country: "Portugal", aliases: ["lis", "lisbon", "lisboa", "portela"] },
  { iata: "OPO", name: "Porto Airport", city: "Porto", country: "Portugal", aliases: ["opo", "porto"] },
  { iata: "FAO", name: "Faro Airport", city: "Faro", country: "Portugal", aliases: ["fao", "faro", "algarve"] },
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria", aliases: ["vie", "vienna", "wien"] },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", aliases: ["zrh", "zurich", "zürich"] },
  { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", aliases: ["gva", "geneva", "geneve"] },
  { iata: "BSL", name: "Basel-Mulhouse-Freiburg Airport", city: "Basel", country: "Switzerland", aliases: ["bsl", "basel", "mulhouse"] },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", aliases: ["bru", "brussels", "zaventem"] },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", aliases: ["dub", "dublin"] },
  { iata: "SNN", name: "Shannon Airport", city: "Shannon", country: "Ireland", aliases: ["snn", "shannon"] },
  { iata: "ORK", name: "Cork Airport", city: "Cork", country: "Ireland", aliases: ["ork", "cork"] },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", aliases: ["cph", "copenhagen", "kastrup"] },
  { iata: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo", country: "Norway", aliases: ["osl", "oslo", "gardermoen"] },
  { iata: "BGO", name: "Bergen Airport", city: "Bergen", country: "Norway", aliases: ["bgo", "bergen", "flesland"] },
  { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden", aliases: ["arn", "stockholm", "arlanda"] },
  { iata: "GOT", name: "Gothenburg Landvetter Airport", city: "Gothenburg", country: "Sweden", aliases: ["got", "gothenburg", "goteborg", "landvetter"] },
  { iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland", aliases: ["hel", "helsinki", "vantaa"] },
  { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", aliases: ["waw", "warsaw", "chopin"] },
  { iata: "KRK", name: "Krakow Airport", city: "Krakow", country: "Poland", aliases: ["krk", "krakow", "cracow"] },
  { iata: "PRG", name: "Prague Václav Havel Airport", city: "Prague", country: "Czech Republic", aliases: ["prg", "prague", "praha"] },
  { iata: "BUD", name: "Budapest Ferenc Liszt Airport", city: "Budapest", country: "Hungary", aliases: ["bud", "budapest", "liszt"] },
  { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece", aliases: ["ath", "athens", "eleftherios venizelos"] },
  { iata: "SKG", name: "Thessaloniki Airport", city: "Thessaloniki", country: "Greece", aliases: ["skg", "thessaloniki", "makedonia"] },
  { iata: "HER", name: "Heraklion Airport", city: "Heraklion", country: "Greece", aliases: ["her", "heraklion", "crete"] },
  { iata: "RHO", name: "Rhodes Airport", city: "Rhodes", country: "Greece", aliases: ["rho", "rhodes", "diagoras"] },
  { iata: "JTR", name: "Santorini Airport", city: "Santorini", country: "Greece", aliases: ["jtr", "santorini", "thira"] },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", aliases: ["ist", "istanbul", "new istanbul"] },
  { iata: "SAW", name: "Istanbul Sabiha Gökçen Airport", city: "Istanbul", country: "Turkey", aliases: ["saw", "sabiha gokcen", "sabiha"] },
  { iata: "AYT", name: "Antalya Airport", city: "Antalya", country: "Turkey", aliases: ["ayt", "antalya"] },
  { iata: "ESB", name: "Ankara Esenboğa Airport", city: "Ankara", country: "Turkey", aliases: ["esb", "ankara", "esenboga"] },
  { iata: "ADB", name: "İzmir Adnan Menderes Airport", city: "İzmir", country: "Turkey", aliases: ["adb", "izmir", "adnan menderes"] },
  { iata: "DLM", name: "Dalaman Airport", city: "Dalaman", country: "Turkey", aliases: ["dlm", "dalaman"] },
  { iata: "BJV", name: "Milas-Bodrum Airport", city: "Bodrum", country: "Turkey", aliases: ["bjv", "bodrum", "milas"] },
  
  // Middle East
  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", aliases: ["dxb", "dubai"] },
  { iata: "DWC", name: "Dubai World Central Airport", city: "Dubai", country: "United Arab Emirates", aliases: ["dwc", "al maktoum", "dubai world central"] },
  { iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "United Arab Emirates", aliases: ["auh", "abu dhabi"] },
  { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", aliases: ["doh", "doha", "hamad"] },
  { iata: "BAH", name: "Bahrain International Airport", city: "Manama", country: "Bahrain", aliases: ["bah", "bahrain", "manama"] },
  { iata: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait", aliases: ["kwi", "kuwait"] },
  { iata: "MCT", name: "Muscat International Airport", city: "Muscat", country: "Oman", aliases: ["mct", "muscat"] },
  { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", aliases: ["ruh", "riyadh", "king khalid"] },
  { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", aliases: ["jed", "jeddah"] },
  { iata: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", aliases: ["tlv", "tel aviv", "ben gurion"] },
  { iata: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordan", aliases: ["amm", "amman", "queen alia"] },
  { iata: "BEY", name: "Beirut-Rafic Hariri International Airport", city: "Beirut", country: "Lebanon", aliases: ["bey", "beirut"] },
  
  // Asia Pacific
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", aliases: ["sin", "singapore", "changi"] },
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", aliases: ["hkg", "hong kong", "chek lap kok"] },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", aliases: ["bkk", "bangkok", "suvarnabhumi"] },
  { iata: "DMK", name: "Don Mueang International Airport", city: "Bangkok", country: "Thailand", aliases: ["dmk", "don mueang", "don muang"] },
  { iata: "HKT", name: "Phuket International Airport", city: "Phuket", country: "Thailand", aliases: ["hkt", "phuket"] },
  { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", aliases: ["kul", "kuala lumpur", "klia"] },
  { iata: "PEN", name: "Penang International Airport", city: "Penang", country: "Malaysia", aliases: ["pen", "penang"] },
  { iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia", aliases: ["cgk", "jakarta", "soekarno hatta"] },
  { iata: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "Indonesia", aliases: ["dps", "bali", "denpasar", "ngurah rai"] },
  { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines", aliases: ["mnl", "manila", "ninoy aquino", "naia"] },
  { iata: "CEB", name: "Mactan-Cebu International Airport", city: "Cebu", country: "Philippines", aliases: ["ceb", "cebu", "mactan"] },
  { iata: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", aliases: ["sgn", "ho chi minh", "saigon", "tan son nhat"] },
  { iata: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam", aliases: ["han", "hanoi", "noi bai"] },
  { iata: "DAD", name: "Da Nang International Airport", city: "Da Nang", country: "Vietnam", aliases: ["dad", "da nang", "danang"] },
  { iata: "REP", name: "Siem Reap International Airport", city: "Siem Reap", country: "Cambodia", aliases: ["rep", "siem reap", "angkor"] },
  { iata: "PNH", name: "Phnom Penh International Airport", city: "Phnom Penh", country: "Cambodia", aliases: ["pnh", "phnom penh"] },
  
  // Japan
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", aliases: ["nrt", "narita", "tokyo narita"] },
  { iata: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", aliases: ["hnd", "haneda", "tokyo haneda", "tokyo"] },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan", aliases: ["kix", "kansai", "osaka"] },
  { iata: "ITM", name: "Osaka Itami Airport", city: "Osaka", country: "Japan", aliases: ["itm", "itami", "osaka itami"] },
  { iata: "NGO", name: "Chubu Centrair International Airport", city: "Nagoya", country: "Japan", aliases: ["ngo", "nagoya", "chubu", "centrair"] },
  { iata: "FUK", name: "Fukuoka Airport", city: "Fukuoka", country: "Japan", aliases: ["fuk", "fukuoka"] },
  { iata: "CTS", name: "New Chitose Airport", city: "Sapporo", country: "Japan", aliases: ["cts", "sapporo", "chitose"] },
  { iata: "OKA", name: "Naha Airport", city: "Okinawa", country: "Japan", aliases: ["oka", "naha", "okinawa"] },
  
  // South Korea
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", aliases: ["icn", "incheon", "seoul incheon", "seoul"] },
  { iata: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "South Korea", aliases: ["gmp", "gimpo", "seoul gimpo"] },
  { iata: "PUS", name: "Gimhae International Airport", city: "Busan", country: "South Korea", aliases: ["pus", "busan", "gimhae"] },
  { iata: "CJU", name: "Jeju International Airport", city: "Jeju", country: "South Korea", aliases: ["cju", "jeju"] },
  
  // China
  { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China", aliases: ["pek", "beijing", "beijing capital"] },
  { iata: "PKX", name: "Beijing Daxing International Airport", city: "Beijing", country: "China", aliases: ["pkx", "daxing", "beijing daxing"] },
  { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China", aliases: ["pvg", "pudong", "shanghai pudong", "shanghai"] },
  { iata: "SHA", name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "China", aliases: ["sha", "hongqiao", "shanghai hongqiao"] },
  { iata: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China", aliases: ["can", "guangzhou", "baiyun"] },
  { iata: "SZX", name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: "China", aliases: ["szx", "shenzhen", "baoan"] },
  { iata: "CTU", name: "Chengdu Shuangliu International Airport", city: "Chengdu", country: "China", aliases: ["ctu", "chengdu", "shuangliu"] },
  { iata: "XIY", name: "Xi'an Xianyang International Airport", city: "Xi'an", country: "China", aliases: ["xiy", "xian", "xianyang"] },
  { iata: "HGH", name: "Hangzhou Xiaoshan International Airport", city: "Hangzhou", country: "China", aliases: ["hgh", "hangzhou", "xiaoshan"] },
  { iata: "KMG", name: "Kunming Changshui International Airport", city: "Kunming", country: "China", aliases: ["kmg", "kunming", "changshui"] },
  
  // India
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", aliases: ["del", "delhi", "new delhi", "indira gandhi"] },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", aliases: ["bom", "mumbai", "bombay"] },
  { iata: "BLR", name: "Kempegowda International Airport", city: "Bangalore", country: "India", aliases: ["blr", "bangalore", "bengaluru", "kempegowda"] },
  { iata: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India", aliases: ["maa", "chennai", "madras"] },
  { iata: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India", aliases: ["hyd", "hyderabad", "rajiv gandhi"] },
  { iata: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India", aliases: ["ccu", "kolkata", "calcutta"] },
  { iata: "COK", name: "Cochin International Airport", city: "Kochi", country: "India", aliases: ["cok", "kochi", "cochin"] },
  { iata: "GOI", name: "Goa International Airport", city: "Goa", country: "India", aliases: ["goi", "goa", "dabolim"] },
  { iata: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", country: "India", aliases: ["amd", "ahmedabad"] },
  { iata: "PNQ", name: "Pune Airport", city: "Pune", country: "India", aliases: ["pnq", "pune"] },
  { iata: "JAI", name: "Jaipur International Airport", city: "Jaipur", country: "India", aliases: ["jai", "jaipur"] },
  
  // Australia & New Zealand
  { iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", aliases: ["syd", "sydney", "kingsford smith"] },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", aliases: ["mel", "melbourne", "tullamarine"] },
  { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", aliases: ["bne", "brisbane"] },
  { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia", aliases: ["per", "perth"] },
  { iata: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia", aliases: ["adl", "adelaide"] },
  { iata: "OOL", name: "Gold Coast Airport", city: "Gold Coast", country: "Australia", aliases: ["ool", "gold coast", "coolangatta"] },
  { iata: "CNS", name: "Cairns Airport", city: "Cairns", country: "Australia", aliases: ["cns", "cairns"] },
  { iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", aliases: ["akl", "auckland"] },
  { iata: "WLG", name: "Wellington International Airport", city: "Wellington", country: "New Zealand", aliases: ["wlg", "wellington"] },
  { iata: "CHC", name: "Christchurch International Airport", city: "Christchurch", country: "New Zealand", aliases: ["chc", "christchurch"] },
  { iata: "ZQN", name: "Queenstown Airport", city: "Queenstown", country: "New Zealand", aliases: ["zqn", "queenstown"] },
  
  // Africa
  { iata: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", country: "South Africa", aliases: ["jnb", "johannesburg", "or tambo"] },
  { iata: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "South Africa", aliases: ["cpt", "cape town"] },
  { iata: "DUR", name: "King Shaka International Airport", city: "Durban", country: "South Africa", aliases: ["dur", "durban", "king shaka"] },
  { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", aliases: ["cai", "cairo"] },
  { iata: "HRG", name: "Hurghada International Airport", city: "Hurghada", country: "Egypt", aliases: ["hrg", "hurghada"] },
  { iata: "SSH", name: "Sharm El Sheikh International Airport", city: "Sharm El Sheikh", country: "Egypt", aliases: ["ssh", "sharm el sheikh", "sharm"] },
  { iata: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco", aliases: ["cmn", "casablanca", "mohammed v"] },
  { iata: "RAK", name: "Marrakech Menara Airport", city: "Marrakech", country: "Morocco", aliases: ["rak", "marrakech", "menara"] },
  { iata: "TNG", name: "Tangier Ibn Battouta Airport", city: "Tangier", country: "Morocco", aliases: ["tng", "tangier"] },
  { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", aliases: ["nbo", "nairobi", "jomo kenyatta"] },
  { iata: "MBA", name: "Moi International Airport", city: "Mombasa", country: "Kenya", aliases: ["mba", "mombasa"] },
  { iata: "ADD", name: "Addis Ababa Bole International Airport", city: "Addis Ababa", country: "Ethiopia", aliases: ["add", "addis ababa", "bole"] },
  { iata: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", aliases: ["los", "lagos", "murtala muhammed"] },
  { iata: "ABJ", name: "Félix-Houphouët-Boigny International Airport", city: "Abidjan", country: "Ivory Coast", aliases: ["abj", "abidjan"] },
  { iata: "DSS", name: "Blaise Diagne International Airport", city: "Dakar", country: "Senegal", aliases: ["dss", "dakar", "blaise diagne"] },
  { iata: "MRU", name: "Sir Seewoosagur Ramgoolam International Airport", city: "Mauritius", country: "Mauritius", aliases: ["mru", "mauritius"] },
  
  // Seychelles
  { iata: "SEZ", name: "Seychelles International Airport", city: "Mahé", country: "Seychelles", aliases: ["sez", "seychelles", "mahe"] },
  
  // Caribbean
  { iata: "MBJ", name: "Sangster International Airport", city: "Montego Bay", country: "Jamaica", aliases: ["mbj", "montego bay", "sangster"] },
  { iata: "KIN", name: "Norman Manley International Airport", city: "Kingston", country: "Jamaica", aliases: ["kin", "kingston", "norman manley"] },
  { iata: "PUJ", name: "Punta Cana International Airport", city: "Punta Cana", country: "Dominican Republic", aliases: ["puj", "punta cana"] },
  { iata: "SDQ", name: "Las Américas International Airport", city: "Santo Domingo", country: "Dominican Republic", aliases: ["sdq", "santo domingo", "las americas"] },
  { iata: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", country: "Bahamas", aliases: ["nas", "nassau", "bahamas"] },
  { iata: "CUN", name: "Cancún International Airport", city: "Cancún", country: "Mexico", aliases: ["cun", "cancun"] },
  { iata: "SJU", name: "Luis Muñoz Marín International Airport", city: "San Juan", country: "Puerto Rico", aliases: ["sju", "san juan", "puerto rico"] },
  { iata: "BGI", name: "Grantley Adams International Airport", city: "Bridgetown", country: "Barbados", aliases: ["bgi", "barbados", "bridgetown"] },
  { iata: "POS", name: "Piarco International Airport", city: "Port of Spain", country: "Trinidad and Tobago", aliases: ["pos", "port of spain", "trinidad"] },
  { iata: "AUA", name: "Queen Beatrix International Airport", city: "Oranjestad", country: "Aruba", aliases: ["aua", "aruba", "oranjestad"] },
  { iata: "CUR", name: "Hato International Airport", city: "Willemstad", country: "Curaçao", aliases: ["cur", "curacao", "willemstad"] },
  { iata: "SXM", name: "Princess Juliana International Airport", city: "Sint Maarten", country: "Sint Maarten", aliases: ["sxm", "st maarten", "sint maarten", "st martin"] },
  
  // South America
  { iata: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo", country: "Brazil", aliases: ["gru", "sao paulo", "guarulhos"] },
  { iata: "GIG", name: "Rio de Janeiro-Galeão International Airport", city: "Rio de Janeiro", country: "Brazil", aliases: ["gig", "rio de janeiro", "galeao", "rio"] },
  { iata: "BSB", name: "Presidente Juscelino Kubitschek International Airport", city: "Brasília", country: "Brazil", aliases: ["bsb", "brasilia"] },
  { iata: "CNF", name: "Tancredo Neves International Airport", city: "Belo Horizonte", country: "Brazil", aliases: ["cnf", "belo horizonte", "confins"] },
  { iata: "SSA", name: "Deputado Luís Eduardo Magalhães International Airport", city: "Salvador", country: "Brazil", aliases: ["ssa", "salvador"] },
  { iata: "REC", name: "Recife/Guararapes-Gilberto Freyre International Airport", city: "Recife", country: "Brazil", aliases: ["rec", "recife"] },
  { iata: "FOR", name: "Pinto Martins International Airport", city: "Fortaleza", country: "Brazil", aliases: ["for", "fortaleza"] },
  { iata: "POA", name: "Salgado Filho International Airport", city: "Porto Alegre", country: "Brazil", aliases: ["poa", "porto alegre"] },
  { iata: "CWB", name: "Afonso Pena International Airport", city: "Curitiba", country: "Brazil", aliases: ["cwb", "curitiba"] },
  { iata: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", aliases: ["eze", "buenos aires", "ezeiza"] },
  { iata: "AEP", name: "Jorge Newbery Airfield", city: "Buenos Aires", country: "Argentina", aliases: ["aep", "aeroparque", "jorge newbery"] },
  { iata: "SCL", name: "Comodoro Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", aliases: ["scl", "santiago", "santiago chile"] },
  { iata: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "Peru", aliases: ["lim", "lima", "jorge chavez"] },
  { iata: "BOG", name: "El Dorado International Airport", city: "Bogotá", country: "Colombia", aliases: ["bog", "bogota", "el dorado"] },
  { iata: "MDE", name: "José María Córdova International Airport", city: "Medellín", country: "Colombia", aliases: ["mde", "medellin", "rionegro"] },
  { iata: "CTG", name: "Rafael Núñez International Airport", city: "Cartagena", country: "Colombia", aliases: ["ctg", "cartagena"] },
  { iata: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "Ecuador", aliases: ["uio", "quito", "mariscal sucre"] },
  { iata: "GYE", name: "José Joaquín de Olmedo International Airport", city: "Guayaquil", country: "Ecuador", aliases: ["gye", "guayaquil"] },
  { iata: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela", aliases: ["ccs", "caracas", "maiquetia"] },
  { iata: "MVD", name: "Carrasco International Airport", city: "Montevideo", country: "Uruguay", aliases: ["mvd", "montevideo", "carrasco"] },
  { iata: "ASU", name: "Silvio Pettirossi International Airport", city: "Asunción", country: "Paraguay", aliases: ["asu", "asuncion"] },
  { iata: "VVI", name: "Viru Viru International Airport", city: "Santa Cruz", country: "Bolivia", aliases: ["vvi", "santa cruz", "viru viru"] },
  { iata: "LPB", name: "El Alto International Airport", city: "La Paz", country: "Bolivia", aliases: ["lpb", "la paz", "el alto"] },
  
  // Mexico & Central America
  { iata: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico", aliases: ["mex", "mexico city", "benito juarez"] },
  { iata: "GDL", name: "Miguel Hidalgo y Costilla International Airport", city: "Guadalajara", country: "Mexico", aliases: ["gdl", "guadalajara"] },
  { iata: "MTY", name: "General Mariano Escobedo International Airport", city: "Monterrey", country: "Mexico", aliases: ["mty", "monterrey"] },
  { iata: "TIJ", name: "Tijuana International Airport", city: "Tijuana", country: "Mexico", aliases: ["tij", "tijuana"] },
  { iata: "SJO", name: "Juan Santamaría International Airport", city: "San José", country: "Costa Rica", aliases: ["sjo", "san jose", "costa rica"] },
  { iata: "PTY", name: "Tocumen International Airport", city: "Panama City", country: "Panama", aliases: ["pty", "panama", "panama city", "tocumen"] },
  { iata: "SAL", name: "Monseñor Óscar Arnulfo Romero International Airport", city: "San Salvador", country: "El Salvador", aliases: ["sal", "san salvador", "el salvador"] },
  { iata: "GUA", name: "La Aurora International Airport", city: "Guatemala City", country: "Guatemala", aliases: ["gua", "guatemala", "guatemala city", "la aurora"] },
  { iata: "TGU", name: "Toncontín International Airport", city: "Tegucigalpa", country: "Honduras", aliases: ["tgu", "tegucigalpa", "honduras"] },
  { iata: "MGA", name: "Augusto C. Sandino International Airport", city: "Managua", country: "Nicaragua", aliases: ["mga", "managua", "nicaragua"] },
  { iata: "BZE", name: "Philip S. W. Goldson International Airport", city: "Belize City", country: "Belize", aliases: ["bze", "belize", "belize city"] },
  
  // Russia & Eastern Europe
  { iata: "SVO", name: "Sheremetyevo International Airport", city: "Moscow", country: "Russia", aliases: ["svo", "sheremetyevo", "moscow sheremetyevo"] },
  { iata: "DME", name: "Domodedovo International Airport", city: "Moscow", country: "Russia", aliases: ["dme", "domodedovo", "moscow domodedovo", "moscow"] },
  { iata: "VKO", name: "Vnukovo International Airport", city: "Moscow", country: "Russia", aliases: ["vko", "vnukovo", "moscow vnukovo"] },
  { iata: "LED", name: "Pulkovo Airport", city: "Saint Petersburg", country: "Russia", aliases: ["led", "pulkovo", "saint petersburg", "st petersburg"] },
  { iata: "KBP", name: "Boryspil International Airport", city: "Kyiv", country: "Ukraine", aliases: ["kbp", "kyiv", "kiev", "boryspil"] },
  { iata: "OTP", name: "Henri Coandă International Airport", city: "Bucharest", country: "Romania", aliases: ["otp", "bucharest", "otopeni", "henri coanda"] },
  { iata: "SOF", name: "Sofia Airport", city: "Sofia", country: "Bulgaria", aliases: ["sof", "sofia", "bulgaria"] },
  { iata: "VAR", name: "Varna Airport", city: "Varna", country: "Bulgaria", aliases: ["var", "varna"] },
  { iata: "BOJ", name: "Burgas Airport", city: "Burgas", country: "Bulgaria", aliases: ["boj", "burgas"] },
  { iata: "BEG", name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "Serbia", aliases: ["beg", "belgrade", "nikola tesla"] },
  { iata: "ZAG", name: "Zagreb Airport", city: "Zagreb", country: "Croatia", aliases: ["zag", "zagreb"] },
  { iata: "SPU", name: "Split Airport", city: "Split", country: "Croatia", aliases: ["spu", "split"] },
  { iata: "DBV", name: "Dubrovnik Airport", city: "Dubrovnik", country: "Croatia", aliases: ["dbv", "dubrovnik"] },
  { iata: "LJU", name: "Ljubljana Jože Pučnik Airport", city: "Ljubljana", country: "Slovenia", aliases: ["lju", "ljubljana"] },
  { iata: "TIA", name: "Tirana International Airport", city: "Tirana", country: "Albania", aliases: ["tia", "tirana"] },
  { iata: "SKP", name: "Skopje International Airport", city: "Skopje", country: "North Macedonia", aliases: ["skp", "skopje"] },
  
  // Canada
  { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada", aliases: ["yyz", "toronto", "pearson"] },
  { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canada", aliases: ["yvr", "vancouver"] },
  { iata: "YUL", name: "Montréal-Pierre Elliott Trudeau International Airport", city: "Montréal", country: "Canada", aliases: ["yul", "montreal", "trudeau"] },
  { iata: "YYC", name: "Calgary International Airport", city: "Calgary", country: "Canada", aliases: ["yyc", "calgary"] },
  { iata: "YEG", name: "Edmonton International Airport", city: "Edmonton", country: "Canada", aliases: ["yeg", "edmonton"] },
  { iata: "YOW", name: "Ottawa Macdonald-Cartier International Airport", city: "Ottawa", country: "Canada", aliases: ["yow", "ottawa"] },
  { iata: "YWG", name: "Winnipeg James Armstrong Richardson International Airport", city: "Winnipeg", country: "Canada", aliases: ["ywg", "winnipeg"] },
  { iata: "YHZ", name: "Halifax Stanfield International Airport", city: "Halifax", country: "Canada", aliases: ["yhz", "halifax"] },
  { iata: "YQB", name: "Québec City Jean Lesage International Airport", city: "Québec City", country: "Canada", aliases: ["yqb", "quebec city", "quebec"] },
  
  // Maldives & Sri Lanka
  { iata: "MLE", name: "Velana International Airport", city: "Malé", country: "Maldives", aliases: ["mle", "male", "maldives", "velana"] },
  { iata: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka", aliases: ["cmb", "colombo", "bandaranaike", "sri lanka"] },
  
  // Nepal & Bangladesh
  { iata: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "Nepal", aliases: ["ktm", "kathmandu", "tribhuvan", "nepal"] },
  { iata: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh", aliases: ["dac", "dhaka", "bangladesh"] },
  
  // Pakistan
  { iata: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "Pakistan", aliases: ["khi", "karachi", "jinnah"] },
  { iata: "LHE", name: "Allama Iqbal International Airport", city: "Lahore", country: "Pakistan", aliases: ["lhe", "lahore", "allama iqbal"] },
  { iata: "ISB", name: "Islamabad International Airport", city: "Islamabad", country: "Pakistan", aliases: ["isb", "islamabad"] },
  
  // Taiwan
  { iata: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", aliases: ["tpe", "taipei", "taoyuan", "taiwan"] },
  { iata: "KHH", name: "Kaohsiung International Airport", city: "Kaohsiung", country: "Taiwan", aliases: ["khh", "kaohsiung"] },
  
  // Cyprus & Malta
  { iata: "LCA", name: "Larnaca International Airport", city: "Larnaca", country: "Cyprus", aliases: ["lca", "larnaca", "cyprus"] },
  { iata: "PFO", name: "Paphos International Airport", city: "Paphos", country: "Cyprus", aliases: ["pfo", "paphos"] },
  { iata: "MLA", name: "Malta International Airport", city: "Valletta", country: "Malta", aliases: ["mla", "malta", "valletta", "luqa"] },
  
  // Iceland
  { iata: "KEF", name: "Keflavík International Airport", city: "Reykjavik", country: "Iceland", aliases: ["kef", "reykjavik", "keflavik", "iceland"] },
  
  // Canary Islands
  { iata: "TFS", name: "Tenerife South Airport", city: "Tenerife", country: "Spain", aliases: ["tfs", "tenerife south", "tenerife"] },
  { iata: "TFN", name: "Tenerife North Airport", city: "Tenerife", country: "Spain", aliases: ["tfn", "tenerife north"] },
  { iata: "LPA", name: "Gran Canaria Airport", city: "Gran Canaria", country: "Spain", aliases: ["lpa", "gran canaria", "las palmas"] },
  { iata: "ACE", name: "Lanzarote Airport", city: "Lanzarote", country: "Spain", aliases: ["ace", "lanzarote"] },
  { iata: "FUE", name: "Fuerteventura Airport", city: "Fuerteventura", country: "Spain", aliases: ["fue", "fuerteventura"] },
  
  // Nice & French Riviera
  { iata: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", aliases: ["nce", "nice", "cote d'azur", "french riviera"] },
  { iata: "MRS", name: "Marseille Provence Airport", city: "Marseille", country: "France", aliases: ["mrs", "marseille", "provence"] },
  { iata: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "France", aliases: ["lys", "lyon", "saint exupery"] },
  { iata: "TLS", name: "Toulouse-Blagnac Airport", city: "Toulouse", country: "France", aliases: ["tls", "toulouse", "blagnac"] },
  { iata: "BOD", name: "Bordeaux-Mérignac Airport", city: "Bordeaux", country: "France", aliases: ["bod", "bordeaux", "merignac"] },
  { iata: "NTE", name: "Nantes Atlantique Airport", city: "Nantes", country: "France", aliases: ["nte", "nantes"] },
  
  // Monaco (uses Nice airport)
  { iata: "MCM", name: "Monaco Heliport", city: "Monaco", country: "Monaco", aliases: ["mcm", "monaco"] },
];

// Search function for airports
export const searchAirports = (query, limit = 10) => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  const isLikelyIATA = /^[a-z]{3}$/i.test(normalizedQuery);
  
  const results = [];
  const seenIata = new Set();
  
  // First pass: exact IATA match (highest priority)
  if (isLikelyIATA) {
    for (const airport of AIRPORTS) {
      if (airport.iata.toLowerCase() === normalizedQuery) {
        results.push({ ...airport, matchType: 'iata_exact', score: 100 });
        seenIata.add(airport.iata);
        break;
      }
    }
  }
  
  // Second pass: IATA starts with (for partial typing)
  for (const airport of AIRPORTS) {
    if (seenIata.has(airport.iata)) continue;
    if (airport.iata.toLowerCase().startsWith(normalizedQuery)) {
      results.push({ ...airport, matchType: 'iata_prefix', score: 90 });
      seenIata.add(airport.iata);
    }
  }
  
  // Third pass: name/city/alias matches
  for (const airport of AIRPORTS) {
    if (seenIata.has(airport.iata)) continue;
    
    const nameMatch = airport.name.toLowerCase().includes(normalizedQuery);
    const cityMatch = airport.city.toLowerCase().includes(normalizedQuery);
    const countryMatch = airport.country.toLowerCase().includes(normalizedQuery);
    const aliasMatch = airport.aliases.some(alias => alias.includes(normalizedQuery));
    
    if (nameMatch || cityMatch || aliasMatch) {
      let score = 0;
      if (airport.city.toLowerCase().startsWith(normalizedQuery)) score = 80;
      else if (cityMatch) score = 70;
      else if (airport.name.toLowerCase().startsWith(normalizedQuery)) score = 75;
      else if (nameMatch) score = 65;
      else if (aliasMatch) score = 60;
      else if (countryMatch) score = 50;
      
      results.push({ ...airport, matchType: 'text', score });
      seenIata.add(airport.iata);
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, limit);
};

// Format airport for display
export const formatAirportDisplay = (airport) => {
  return `${airport.name} (${airport.iata}) – ${airport.city}, ${airport.country}`;
};

export default AIRPORTS;
