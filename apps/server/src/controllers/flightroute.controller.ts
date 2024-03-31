import type { Request, Response } from "express";
import BaseController from "../bases/controller.base";
import { FlightRouteService } from "../services";
import type { FlightRouteParams } from "../typedef/flightroute";
import { logger as consola } from "../utils";

class FlightRouteController extends BaseController {
  public performSearch = async (req: Request<{}, {}, FlightRouteParams, {}>, res: Response) => {
    const logger = consola.withTag("FlightRouteSearch");
    const requestBody = req.body;
    logger.start(`Start to search route from ${requestBody.from} to ${requestBody.to}...`);

    try {
      // Wait for result
      const routeMap = await FlightRouteService.calculateRoute(requestBody);

      // Convert result into Array of Object
      const routeArray = Array.from(routeMap.entries())
        .sort((a, b) => a[0] - b[0])
        .flatMap(([_index, route]) => (
          route.map((value) => {
            const { from, to, route: routeData } = value;
            return { from: from.airport, to: to.airport, route: routeData };
          })
        ));

      logger.log(
        `The route from ${requestBody.from} to ${requestBody.to} is:`,
      );
      routeArray.forEach((value) => logger.log(`${value.from.iata} -> ${value.to.iata}`));
      logger.success("Search completed.");

      res.set("Content-Type", "application/json").send(JSON.stringify(routeArray));
    } catch (err) {
      logger.error(err);
      res.status(500).send(err instanceof Error ? err.message : err);
    }
  };
}

export default FlightRouteController;
