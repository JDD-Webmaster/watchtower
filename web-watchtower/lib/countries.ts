import countriesJson from "@/lib/countries.json";

export interface Country {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  numeric_code: string;
  phone_code: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  tld: string;
  native: string;
  region: string;
  region_id: string;
  subregion: string;
  subregion_id: string;
  nationality: string;
  timezones: Array<{
    zoneName: string;
    gmtOffset: number;
    gmtOffsetName: string;
    abbreviation: string;
    tzName: string;
  }>;
  translations: Record<string, string>;
  latitude: string;
  longitude: string;
  emoji: string;
  emojiU: string;
}

export const countries = countriesJson as Country[];

export function getCountryByIso2(iso2: string | null | undefined): Country | undefined {
  if (!iso2) return undefined;
  return countries.find((c) => c.iso2 === iso2);
}

export function getDefaultTimezone(iso2: string | null | undefined): string {
  const country = getCountryByIso2(iso2);
  return country?.timezones?.[0]?.zoneName || "UTC";
}

// Common IANA timezones (curated) plus all supported by browser for flexibility
export const COMMON_TIMEZONES = [
  "UTC",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Casablanca",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
] as const;

export function getAllTimezones(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      const all = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
      return Array.from(new Set([...COMMON_TIMEZONES, ...all])).sort();
    }
  } catch {}
  return [...COMMON_TIMEZONES];
}
