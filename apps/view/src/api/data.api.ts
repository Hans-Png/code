import type { AirportEnity, CountryEntity } from "../types/data";

// Variables

const backendUrl = process.env.BACKEND_URL ?? "http://localhost";
const backendPort = process.env.BACKEND_PORT ?? "8080";
const backendApi = process.env.BACKEND_API ?? "api";
const endpoint = `${backendUrl}:${backendPort}/${backendApi}`;

const openStreetMapUrl = process.env.OPENSTREETMAP_URL ?? "https://nominatim.openstreetmap.org";

// API Calls

const getAirportList = async () => {
  const response = await fetch(`${endpoint}/data/allairports`);
  const data: AirportEnity[] = await response.json();
  return data;
};

const getCountriesList = async () => {
  const response = await fetch(`${endpoint}/data/allcountries`);
  const data: CountryEntity[] = await response.json();
  return data;
};

const getLocalizedAirportName = async (iata: string, lang: string) => {
  const langCode = lang === "zh" ? "zh-Hant" : lang;
  const searchParams = new URLSearchParams({
    "q": iata,
    "accept-language": langCode,
    "format": "jsonv2",
    "limit": "1",
  });
  const response = await fetch(`${openStreetMapUrl}/search?${searchParams}`);
  const data: Array<{ name: string }> = await response.json();

  return data[0].name;
};

const getSearchResultInEnlish = async (query: string, lang: string) => {
  const searchParams = new URLSearchParams({
    "q": query,
    "accept-language": "en",
    "format": "jsonv2",
    "limit": "1",
  });
};

export { getAirportList, getCountriesList };
