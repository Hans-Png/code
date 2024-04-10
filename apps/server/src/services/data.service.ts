import BaseService from "../bases/service.base";
import Database from "../database";
import { AirportEntity, CountryEntity, RouteEntity, VisaPolicyEntity } from "../entities";
import type { TravelDocInfo, VisaInfo } from "../typedef/flightroute";
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

    const visaPolicies = await em.findAll(VisaPolicyEntity, { populate: ["fromCountry"] });
    const validCountries = new Set(visaPolicies.map((policy) => policy.fromCountry.code));
    const countriesList = await em.find(CountryEntity, { code: { $in: [...validCountries] } });

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

  public static async checkIsRequireVisa(
    destination: string,
    travelDocs: TravelDocInfo,
    visaInfos: VisaInfo[],
  ) {
    // Do not check this case as normally has right to entry
    if (travelDocs.nationality === destination) {
      return false;
    }

    // Get all visa requirements data
    const visaRequirement = await this.getVisaRequirement(travelDocs.nationality, destination);

    // Assume need visa if no data is found
    if (!visaRequirement) {
      return !visaInfos.some((visaInfo) => visaInfo.country === destination);
    }

    const { visaRequirementType } = visaRequirement;

    // Handle visa is required case
    if (visaRequirementType === "visa required") {
      // Handle the case that held foreign visa also has visa priviedge
      const { specialVisaRequirements } = visaRequirement;
      const isSpecialArrangementApplicable = specialVisaRequirements?.some((specialRequirement) => {
        const isHasCertainVisaType = visaInfos.some((visaInfo) => (
          // Checking is it a target visa of special requirement
          specialRequirement.countryCode === visaInfo.country
          // Also check the visa type is fulfilled requirement
          && visaInfo.type === specialRequirement.visaType
        ));
        return isHasCertainVisaType;
      });
      if (isSpecialArrangementApplicable) {
        return false; // if have target visa, then no visa is required
      }

      // Finally, check the result from current visa information
      return !visaInfos.some((visaInfo) => visaInfo.country === destination);
    }

    return false;
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
