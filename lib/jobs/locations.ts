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
  // Countries & Continents
  "usa", "united states", "u.s.", "north america", "canada", "mexico", "brazil", "latam",
  "uk", "u.k.", "united kingdom", "england", "scotland", "britain", "london",
  "germany", "deutschland", "berlin", "munich", "frankfurt", "dach",
  "france", "paris", "spain", "madrid", "barcelona", "italy", "rome", "milan",
  "ireland", "dublin", "netherlands", "amsterdam", "holland",
  "poland", "warsaw", "krakow", "sweden", "stockholm", "switzerland", "zurich", "geneva", "austria", "vienna",
  "australia", "sydney", "melbourne", "brisbane", "new zealand", "auckland",
  "singapore", "japan", "tokyo", "europe", "emea", "nordics",
  // US States & Cities
  "maryland", "virginia", "washington", "florida", "north carolina", "south carolina",
  "georgia", "illinois", "california", "texas", "colorado", "massachusetts", "new york",
  "district of columbia", "fed", "tennessee", "minnesota", "ontario", "quebec", "toronto", "vancouver",
  "san francisco", "austin", "seattle", "chicago", "boston", "atlanta", "denver", "los angeles",
  "us-", "ca-", "uk-", "de-", "fr-", "us remote", "canada remote", "uk remote", "europe remote"
];

export const NON_ENGINEERING_ROLES = [
  "account executive", "sales executive", "sales engineer", "partner manager", "sales specialist",
  "sales manager", "risk strategist", "compliance", "product marketing", "marketing manager",
  "product counsel", "legal counsel", "tax", "payroll", "filing specialist", "credit risk",
  "underwriter", "recruiter", "human resources", "talent acquisition", "office manager",
  "executive assistant", "financial analyst", "bookkeeper", "copywriter", "content manager",
  "customer support", "customer success", "sales representative", "bdr", "sdr", "business development",
  "account manager", "commercial counsel", "head of marketing", "head of sales", "claims", "insurance"
];

export const ENGINEERING_TARGET_KEYWORDS = [
  "software", "developer", "engineer", "full stack", "fullstack", "frontend", "front-end",
  "backend", "back-end", "web developer", "react", "typescript", "javascript", "node",
  "python", "golang", "go engineer", "rust", "java", "devops", "cloud engineer",
  "sre", "platform engineer", "data engineer", "ai engineer", "machine learning",
  "mobile developer", "ios", "android", "tech lead", "technical lead", "architect", "programmer", "qa engineer", "sdet"
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
 * Validates whether a job title matches target engineering / software roles and rejects non-engineering roles.
 */
export function isRoleMatchingTargets(
  jobTitle: string = "",
  userTargetRoles: string[] = []
): { matches: boolean; reason?: string } {
  const title = (jobTitle || "").toLowerCase().trim();

  // 1. Strict Exclusions: Non-engineering roles (Sales, Marketing, HR, Legal, Tax, Support)
  const isExcludedRole = NON_ENGINEERING_ROLES.some((role) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${role}(?:$|[^a-z0-9])`, "i");
    return pattern.test(title);
  });

  if (isExcludedRole) {
    return { matches: false, reason: `Role "${jobTitle}" is a non-technical role` };
  }

  // 2. Target Role Overlap check
  const activeTargets = userTargetRoles.length > 0 ? userTargetRoles : ENGINEERING_TARGET_KEYWORDS;
  const matchesTarget = activeTargets.some((target) => {
    const norm = target.toLowerCase().trim();
    return title.includes(norm) || norm.includes(title);
  }) || ENGINEERING_TARGET_KEYWORDS.some((kw) => title.includes(kw));

  if (!matchesTarget) {
    return { matches: false, reason: `Role "${jobTitle}" does not match target technical roles` };
  }

  return { matches: true };
}

/**
 * Validates whether a job posting is explicitly based in India or an Indian state/tech hub.
 */
export function isLocationMatchingIndia(
  jobLocation: string = "",
  selectedState: string = "all_india"
): { matches: boolean; reason?: string } {
  const loc = (jobLocation || "").toLowerCase().trim();

  if (!loc) {
    return { matches: false, reason: "Missing location" };
  }

  // 1. Foreign keywords check
  const isForeignRestricted = FOREIGN_RESTRICTED_KEYWORDS.some((foreign) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${foreign}(?:$|[^a-z0-9])`, "i");
    return pattern.test(loc);
  });

  // 2. Check if explicit Indian city / state / India keyword is present
  const hasIndiaKeyword = ALL_INDIAN_LOCATIONS.some((ind) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${ind}(?:$|[^a-z0-9])`, "i");
    return pattern.test(loc);
  });

  // If foreign country/city is present and India is NOT present, reject immediately
  if (isForeignRestricted && !hasIndiaKeyword) {
    return { matches: false, reason: `Location "${jobLocation}" is restricted to foreign region outside India` };
  }

  // If it matches an Indian city/state or India
  if (hasIndiaKeyword) {
    if (selectedState && selectedState !== "all_india" && selectedState !== "India") {
      const stateKeywords = STATE_KEYWORD_MAP[selectedState] || [];
      const matchesSelectedState = stateKeywords.some((kw) => {
        const pattern = new RegExp(`(?:^|[^a-z0-9])${kw}(?:$|[^a-z0-9])`, "i");
        return pattern.test(loc);
      });

      const isGeneralIndia =
        loc === "india" ||
        loc.includes("remote, india") ||
        loc.includes("india, remote") ||
        loc.includes("india - remote") ||
        loc.includes("pan india");

      if (!matchesSelectedState && !isGeneralIndia) {
        return { matches: false, reason: `Location "${jobLocation}" does not match selected state: ${selectedState}` };
      }
    }
    return { matches: true };
  }

  return { matches: false, reason: `Location "${jobLocation}" is outside India` };
}