import BaseService from "../bases/service.base";
import Database from "../database";
import { AirportEntity, CountryEntity, RouteEntity, VisaPolicyEntity } from "../entities";
import { logger as consola } from "../utils";

class DataService extends BaseService {
  static #logger = consola.withTag("DataService");

  // Get //

  public static async getAirports() {
    const db = Database.getInstance();
    const { em } = db;

    // Only get airport data that has route
    const routes = await em.findAll(RouteEntity, { populate: ["fromAirport", "fromAirport.iata"] });
    const airportIds = routes.map((route) => route.fromAirport.iata);
    const airports = await em.find(AirportEntity, { iata: { $in: airportIds } });

    return airports;
  }

  public static async getAirport(iata: string) {
    const db = Database.getInstance();
    const { em } = db;

    const targetAirport = await em.findOne(AirportEntity, { iata });

    return targetAirport;
  }

  public static async getCountries() {
    const db = Database.getInstance();
    const { em } = db;

    const countriesList = await em.findAll(CountryEntity);

    return countriesList;
  }

  public static async getVisaRequirement(nationality: string, destination: string) {
    const db = Database.getInstance();
    const { em } = db;

    const visaRequirement = await em.findOne(VisaPolicyEntity, {
      fromCountry: nationality,
      toCountry: destination,
    });

    return visaRequirement;
  }

  // Updates //

  public static async updateAirportLocalizedName(
    language: string,
    iata: string,
    localizedName: string,
  ) {
    const db = Database.getInstance();
    const { em } = db;

    try {
      const targetAirport = await em.findOneOrFail(AirportEntity, { iata });
      targetAirport.localizedName = { ...targetAirport.localizedName, [language]: localizedName };
      await em.persistAndFlush(targetAirport);
    } catch (err) {
      const errMessage = `Airport with iata ${iata} not found.`;
      throw new ReferenceError(errMessage, { cause: err });
    }
  }
}

export default DataService;
