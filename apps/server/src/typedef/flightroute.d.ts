import type { AirportEntity, RouteEntity } from "../entities";

export interface TravelDocInfo {
  /** Nationality as specified on the travel document */
  nationality: string;
  /** Type of travel document, default "Ordinary" */
  type: string;
}

export interface VisaInfo {
  /** Country code in ISO 3166-1 alpha-3 */
  country: string;
  /** Type of visa, default "Tourist" */
  type: string;
}

export interface FlightRouteParams {
  /** Departure airport in IATA code */
  from: string;
  /** Arrival airport in IATA code */
  to: string;
  /** Transit airports in IATA code, which require to visit, and visit in order */
  transitThrough?: string[];
  /** Travel documents held by passenger */
  travelDocs: TravelDocInfo[];
  /** Additional visa info held by passenger */
  visaInfos: VisaInfo[];
  /** Rule sets to be applied to the calculation. */
  ruleSets?: unknown;
}

export interface AirportNode {
  airport: AirportEntity;
  parent: AirportNode | null;
  routeToParent: RouteEntity | null;
  /** If node has route to destination, store it. */
  routeToDestination: RouteEntity | null;
  /**
   * Number of nodes from the start node to the current node.
   * @default 0
   */
  nodeToParentCount: number;
  /** Distance from the start node to the current node. */
  distanceSoFar: number;
  /** path cost */
  gScore: number;
  /** heuristic cost */
  hScore: number;
  /** total estimate cost */
  fScore: number;
}

export interface RouteData {
  from: AirportNode;
  to: AirportNode;
  route: RouteEntity;
  totalCost?: number;
}
