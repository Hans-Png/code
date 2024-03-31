import BaseService from "../bases/service.base";
import { logger as consola } from "../utils";

interface SearchResponse {
  toponymName: string;
  name: string;
  lat: number;
  lng: number;
  geonameId: number;
  /** ISO 3166 Alpha2 */
  countryCode: string;
  countryName: number;
  fcl: string;
  fcode: string;
  population: number;
}

class GeoNameService extends BaseService {
  static #logger = consola.withTag(this.name);
  static #apiUrl = process.env.GEONAME_API_URL ?? "http://api.geonames.org";
  static #geoNameUser = "png_singhan";

  public static async getCityName(
    { name, country, locale = "en" }: { name: string; country?: string; locale: string },
  ) {
    const endpoint = "search";
    const urlName = encodeURIComponent(name);
    const requestParams = {
      name: urlName,
      country: country?.toUpperCase() ?? "",
      lang: locale,
      maxRows: String(10),
      type: "json",
    };
    const response = await fetch(this.returnEncodedUrl(endpoint, requestParams));
    const data: { name: string }[] = await response.json();
    return data[0];
  }

  public static async getAirportName({ iata, locale = "en" }: { iata: string; locale: string }) {
    const endpoint = "search";
    const urlIata = encodeURIComponent(iata);
    const requestParams = {
      name_equals: urlIata,
      lang: locale,
      featureCode: "AIRP",
      maxRows: String(5),
      type: "json",
    };
    const response = await fetch(this.returnEncodedUrl(endpoint, requestParams));
    const data: SearchResponse[] = await response.json();
    return data[0];
  }

  // Helpers//

  private static returnEncodedUrl(endpoint: string, searchParams?: Record<string, string>) {
    return encodeURI(
      `${this.#apiUrl}/${endpoint}${
        searchParams
          ? `?${() => {
            const params = new URLSearchParams(searchParams);
            params.append("username", this.#geoNameUser);
            return params.toString();
          }}`
          : ""
      }`,
    );
  }
}

export default GeoNameService;
