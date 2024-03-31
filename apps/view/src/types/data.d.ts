export interface AirportEnity {
  iata: string;
  latitude: number;
  longitude: number;
  /** In English */
  cityName: string;
  localizedCityName?: { [language: string]: string };
  country: string;
  /** In English */
  name: string;
  localizedName?: { [language: string]: string };
}

export interface CountryEntity {
  code: string;
  altCode: string;
  name: { [language: string]: string };
}
