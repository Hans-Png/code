import type { Request, Response } from "express";
import BaseController from "../bases/controller.base";
import { DataService, FlightRouteService } from "../services";
import type { FlightRouteParams, TravelDocInfo } from "../typedef/flightroute";
import { logger as consola } from "../utils";

class FlightRouteController extends BaseController {
  public performSearch = async (req: Request<{}, {}, FlightRouteParams, {}>, res: Response) => {
    const logger = consola.withTag("FlightRouteSearch");
    const requestBody = req.body;
    logger.start(`Start to search route from ${requestBody.from} to ${requestBody.to}...`);

    try {
      // Travel Docs and Visa Info
      const { travelDocs, visaInfos, to: toIata, transitThrough } = requestBody;

      // Wait for result
      const routeMap = await FlightRouteService.calculateRoute(requestBody);

      // Convert result into Array of Object
      const routeArray = await Promise.all(
        Array.from(routeMap.entries())
          .sort((a, b) => a[0] - b[0])
          .flatMap(([_index, route]) => (
            route.map(async (value) => {
              const { from, to, route: routeData } = value;
              const { airport: fromAirport } = from;
              const { airport: toAirport } = to;
              const result = {
                from: fromAirport,
                to: toAirport,
                route: routeData,
                isTo: false,
                isVisaRequired: false,
                suggestTravelDocs: [] as TravelDocInfo[],
              };

              // Write additional data
              if (toIata === toAirport.iata || transitThrough?.includes(toAirport.iata)) {
                // Do not check visa requirement if target is specified by the user
                result.isTo = true;
              } else if (fromAirport.country.code !== toAirport.country.code) {
                const visaRequirements = await Promise.all(travelDocs.map(async (doc) => {
                  if (doc.nationality === toAirport.country.code) {
                    return { travelDoc: doc, visaInfo: "freedom of movement" };
                  }
                  const visaInfo = await DataService.getVisaRequirement(
                    doc.nationality,
                    toAirport.country.code,
                  );
                  return { travelDoc: doc, visaInfo: visaInfo!.visaRequirementType };
                }));

                consola.info(visaRequirements);

                const isVisaRequired = visaRequirements.every((visaInfoItem) => (
                  visaInfoItem.visaInfo === "visa required"
                ));
                result.isVisaRequired = isVisaRequired;

                if (!isVisaRequired) {
                  const ownCountryDoc = visaRequirements.find((visaInfoItem) => (
                    visaInfoItem.travelDoc.nationality === fromAirport.country.code
                  ));
                  if (ownCountryDoc) {
                    result.suggestTravelDocs.push(ownCountryDoc.travelDoc);
                  } else {
                    const noVisaRequiredDocs = visaRequirements.filter((visaInfoItem) => (
                      visaInfoItem.visaInfo !== "visa required"
                    ));
                    result.suggestTravelDocs = [
                      ...result.suggestTravelDocs,
                      ...noVisaRequiredDocs.map((visaInfoItem) => visaInfoItem.travelDoc),
                    ];
                  }
                } else {
                  const visaInformation = visaInfos.find((visaInfoItem) => (
                    visaInfoItem.country === toAirport.country.code
                  ));
                  consola.info(visaInformation);
                  result.isVisaRequired = Boolean(!visaInformation);
                }
              }

              return result;
            })
          )),
      );

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
