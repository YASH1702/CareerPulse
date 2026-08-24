export interface LocationOption {
  id: string;
  label: string;
  state: string;
  searchQuery: string;
  isPopular?: boolean;
}

export const INDIA_LOCATION_OPTIONS: LocationOption[] = [
  { id: "all_india", label: "🇮🇳 All India (Default)", state: "All", searchQuery: "India", isPopular: true },
  { id: "karnataka", label: "Karnataka (Bangalore / Bengaluru)", state: "Karnataka", searchQuery: "Bengaluru, Karnataka, India", isPopular: true },
  { id: "telangana", label: "Telangana (Hyderabad)", state: "Telangana", searchQuery: "Hyderabad, Telangana, India", isPopular: true },
  { id: "maharashtra", label: "Maharashtra (Pune & Mumbai)", state: "Maharashtra", searchQuery: "Pune, Maharashtra, India", isPopular: true },
  { id: "delhi_ncr", label: "Delhi NCR (Delhi, Gurgaon, Noida)", state: "Delhi NCR", searchQuery: "Gurgaon, Haryana, India", isPopular: true },
  { id: "tamil_nadu", label: "Tamil Nadu (Chennai)", state: "Tamil Nadu", searchQuery: "Chennai, Tamil Nadu, India", isPopular: true },
  { id: "kerala", label: "Kerala (Kochi & Trivandrum)", state: "Kerala", searchQuery: "Kochi, Kerala, India" },
  { id: "gujarat", label: "Gujarat (Ahmedabad & Gandhinagar)", state: "Gujarat", searchQuery: "Ahmedabad, Gujarat, India" },
  { id: "west_bengal", label: "West Bengal (Kolkata)", state: "West Bengal", searchQuery: "Kolkata, West Bengal, India" },
  { id: "rajasthan", label: "Rajasthan (Jaipur)", state: "Rajasthan", searchQuery: "Jaipur, Rajasthan, India" },
  { id: "andhra_pradesh", label: "Andhra Pradesh (Visakhapatnam)", state: "Andhra Pradesh", searchQuery: "Visakhapatnam, Andhra Pradesh, India" },
  { id: "punjab_haryana", label: "Punjab & Chandigarh (Mohali)", state: "Punjab", searchQuery: "Chandigarh, India" },
  { id: "remote_india", label: "🌐 Remote (India & Global)", state: "Remote", searchQuery: "Remote, India", isPopular: true },
];

export const STATE_KEYWORD_MAP: Record<string, string[]> = {
  karnataka: ["karnataka", "bangalore", "bengaluru", "mysore", "mysuru", "mangalore", "hubli", "blr"],
  telangana: ["telangana", "hyderabad", "secunderabad", "warangal", "hyd"],
  maharashtra: ["maharashtra", "pune", "mumbai", "navi mumbai", "thane", "nagpur", "nashik", "bom"],
  delhi_ncr: ["delhi", "new delhi", "gurgaon", "gurugram", "noida", "greater noida", "faridabad", "ghaziabad", "ncr", "haryana"],
  tamil_nadu: ["tamil nadu", "tamilnadu", "chennai", "coimbatore", "madurai", "maa"],
  kerala: ["kerala", "kochi", "cochin", "trivandrum", "thiruvananthapuram", "calicut", "kozhikode"],
  gujarat: ["gujarat", "ahmedabad", "gandhinagar", "surat", "vadodara"],
  west_bengal: ["west bengal", "kolkata", "calcutta"],
  rajasthan: ["rajasthan", "jaipur", "udaipur", "jodhpur"],
  andhra_pradesh: ["andhra pradesh", "andhra", "visakhapatnam", "vizag", "vijayawada", "tirupati"],
  punjab_haryana: ["punjab", "chandigarh", "mohali", "panchkula"],
  remote_india: ["remote", "worldwide", "global", "anywhere", "work from home", "wfh", "india"],
};

export const ALL_INDIAN_LOCATIONS = [
  "india", "in", "bharat",
  "bangalore", "bengaluru", "karnataka", "mysore", "mysuru", "mangalore", "hubli", "blr",
  "hyderabad", "telangana", "secunderabad", "warangal", "hyd",
  "pune", "mumbai", "maharashtra", "navi mumbai", "thane", "nagpur", "nashik", "bom",
  "delhi", "new delhi", "gurgaon", "gurugram", "noida", "greater noida", "faridabad", "ghaziabad", "ncr", "haryana",
  "chennai", "tamil nadu", "tamilnadu", "coimbatore", "madurai", "maa",
  "kochi", "kerala", "cochin", "trivandrum", "thiruvananthapuram", "calicut",
  "ahmedabad", "gujarat", "gandhinagar", "surat", "vadodara",
  "kolkata", "west bengal", "calcutta",
  "jaipur", "rajasthan", "udaipur", "jodhpur",
  "visakhapatnam", "vizag", "andhra pradesh", "vijayawada",
  "chandigarh", "punjab", "mohali",
  "indore", "bhopal", "madhya pradesh",
  "lucknow", "kanpur", "uttar pradesh",
  "bhubaneswar", "odisha",
  "guwahati", "assam",
  "goa"
];

export const FOREIGN_RESTRICTED_KEYWORDS = [
  "us only", "usa only", "united states", "u.s. only", "north america only",
  "emea only", "europe only", "uk only", "canada only", "latam only",
  "san francisco", "new york", "austin, tx", "seattle, wa", "boston, ma",
  "chicago, il", "los angeles", "california, us", "texas, us", "washington, us",
  "london, uk", "berlin, germany", "munich, germany", "toronto, canada",
  "vancouver, canada", "sydney, australia", "melbourne, australia",
  "dublin, ireland", "amsterdam, netherlands", "paris, france", "tokyo, japan"
];

/**
 * Normalizes location string for scraper search queries.
 */
export function getScraperLocationQuery(locationOrState = "India"): string {
  const match = INDIA_LOCATION_OPTIONS.find(
    (loc) => loc.id === locationOrState || loc.state.toLowerCase() === locationOrState.toLowerCase() || loc.label.toLowerCase().includes(locationOrState.toLowerCase())
  );
  return match ? match.searchQuery : locationOrState || "India";
}

/**
 * Validates whether a job posting is based in India or open to Indian applicants (Global/Remote).
 */
export function isLocationMatchingIndia(
  jobLocation: string = "",
  selectedState: string = "all_india"
): { matches: boolean; reason?: string } {
  const loc = (jobLocation || "").toLowerCase().trim();

  // If no location provided, treat as open remote
  if (!loc) {
    return { matches: true };
  }

  // 1. Strict Foreign Exclusions: If strictly restricted to foreign region without India
  const isForeignRestricted = FOREIGN_RESTRICTED_KEYWORDS.some((foreign) => loc.includes(foreign));
  const hasIndiaKeyword = ALL_INDIAN_LOCATIONS.some((ind) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${ind}(?:$|[^a-z0-9])`, "i");
    return pattern.test(loc);
  });

  if (isForeignRestricted && !hasIndiaKeyword) {
    return { matches: false, reason: `Location "${jobLocation}" is restricted to foreign region outside India` };
  }

  // 2. If it explicitly matches an Indian city/state or India
  if (hasIndiaKeyword) {
    // If user picked a specific state filter, check state match
    if (selectedState && selectedState !== "all_india" && selectedState !== "India") {
      const stateKeywords = STATE_KEYWORD_MAP[selectedState] || [];
      const matchesSelectedState = stateKeywords.some((kw) => {
        const pattern = new RegExp(`(?:^|[^a-z0-9])${kw}(?:$|[^a-z0-9])`, "i");
        return pattern.test(loc);
      });

      // Also allow pure "India" or "Remote" as fallback
      const isGeneralIndiaOrRemote = loc === "india" || loc.includes("remote") || loc.includes("anywhere") || loc.includes("worldwide");

      if (!matchesSelectedState && !isGeneralIndiaOrRemote) {
        return { matches: false, reason: `Location "${jobLocation}" does not match selected state: ${selectedState}` };
      }
    }
    return { matches: true };
  }

  // 3. Open Global Remote (e.g., "Remote", "Worldwide", "Anywhere", "Work from Anywhere")
  const isGlobalRemote =
    loc.includes("remote") ||
    loc.includes("worldwide") ||
    loc.includes("anywhere") ||
    loc.includes("global") ||
    loc.includes("apac") ||
    loc.includes("wfh");

  if (isGlobalRemote) {
    return { matches: true };
  }

  // Otherwise, if it's an unrecognized on-site foreign city (e.g. "Berlin", "London", "Austin")
  return { matches: false, reason: `Location "${jobLocation}" is not in India or open remote` };
}