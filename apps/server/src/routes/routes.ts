import type BaseRoute from "../bases/route.base";
import DataRoute from "./data.route";
import FlightRouteRoute from "./flightroute.route";

const routes: BaseRoute[] = [
  new DataRoute(),
  new FlightRouteRoute(),
];

export default routes;
