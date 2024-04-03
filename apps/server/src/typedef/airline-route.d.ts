export type AirlineRouteJson = {
  [airportCode: string]: AirportInfo;
};

export interface RouteInfo {
  carriers: Array<string | null>;
  iata: string;
  km: number;
  min: number;
}

export interface AirportInfo {
  city_name: string;
  continent: string;
  country: string;
  country_code: string;
  display_name: string;
  elevation: number;
  iata: string;
  icao: string;
  latitude: number;
  longitude: number;
  name: string;
  routes: RouteInfo[];
  timezone: string;
}

export interface TransitPolicyData {
  country: string;
  transitVisaRequired: boolean;
  transitDurationHours: number;
  applicableTo: { countryCode: string; travelDocumentType: string }[];
}
