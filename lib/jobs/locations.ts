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
  { id: "remote_india", label: "🌐 Remote (India & Global)", state: "Remote", searchQuery: "Remote", isPopular: true },
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