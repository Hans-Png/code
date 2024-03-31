// Variables

import { HttpStatusError } from "common-errors";
import consola from "consola";
import type { AirportEnity } from "../types/data";
import type { FlightRouteParams } from "../types/flightroute";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost";
const backendPort = process.env.BACKEND_PORT ?? "8080";
const backendApi = process.env.BACKEND_API ?? "api";
const endpoint = `${backendUrl}:${backendPort}/${backendApi}`;

// API Calls

const getFlightRouteResult = async (data: FlightRouteParams) => {
  const result = await fetch(`${endpoint}/flightroute/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  // Handle errors
  if (!result.ok) {
    const errMsg = await result.text();
    throw new HttpStatusError(500, errMsg);
  }

  const dataResult: {
    from: AirportEnity;
    to: AirportEnity;
    route: { time: number; distance: number };
  }[] = await result.json();
  consola.info("FlightRouteAPI.getFlightRouteResult", dataResult);
  return dataResult;
};

export default getFlightRouteResult;
