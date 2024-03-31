import BaseRoute from "../bases/route.base";
import { FlightRouteController } from "../controllers";

class FlightRouteRoute extends BaseRoute {
  #controller: FlightRouteController;

  constructor() {
    super("FlightRoute", "flightroute");
    this.#controller = new FlightRouteController();
    this.setRoutes();
  }

  protected setRoutes(): void {
    this.router.post("/search", this.#controller.performSearch);
  }
}

export default FlightRouteRoute;
