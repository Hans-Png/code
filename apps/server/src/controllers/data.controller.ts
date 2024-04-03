import type { Request, Response } from "express";
import BaseController from "../bases/controller.base";
import { DataService } from "../services";
import { logger as consola } from "../utils";

class DataController extends BaseController {
  public getAllAirports = async (_req: Request, res: Response) => {
    const logger = consola.withTag("DataController:getAllAirports");
    logger.log("Receive get all airports request.");
    try {
      const data = await DataService.getAirports();
      res.set("Content-Type", "application/json").send(JSON.stringify(data));
    } catch (err) {
      logger.error(err);
      res.status(500).send(err);
    }
  };

  public getAllCountries = async (_req: Request, res: Response) => {
    const logger = consola.withTag("DataController:getAllCountries");
    logger.log("Receive get all countries request.");
    try {
      const data = await DataService.getCountries();
      res.set("Content-Type", "application/json").send(JSON.stringify(data));
    } catch (err) {
      logger.error(err);
      res.status(500).send(err);
    }
  };
}

export default DataController;
