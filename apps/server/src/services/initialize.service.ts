import { NotFoundError } from "common-errors";
import fs from "fs/promises";
import path from "path";
import BaseService from "../bases/service.base";
import Database from "../database";
import {
  AirportEntity,
  CarrierEntity,
  CountryEntity,
  RouteCarrierEntity,
  RouteEntity,
  VisaPolicyEntity,
} from "../entities";
import type { AirlineRouteJson, RouteInfo } from "../typedef/airline-route";
import { dirPath, logger as consola } from "../utils";

class InitializeService extends BaseService {
  static #logger = consola.withTag("InitializeService");

  public static async initializeDatabase() {
    try {
      this.#logger.start("Initializing database...");

      // Intialize database interface
      const db = Database.getInstance();
      const { orm } = db;
      const generator = orm.getSchemaGenerator();

      // Refresh database
      await generator.dropSchema();
      await generator.createSchema();

      // Write
      await this.writeCountryData();
      await this.writeCountryDataPatch(); // Write additional or patched country data
      await this.writeVisaPolicyData();
      await this.writeAirlineRoutesData();

      this.#logger.success("Database initialized successfully.");
    } catch (error) {
      this.#logger.error(error);
    }
  }

  // Helpers //

  private static async writeCountryData() {
    // Start
    this.#logger.start("Writing countries data into database...");

    // Prepare database instance
    const db = Database.getInstance();
    const { em } = db;

    // Declare required variables
    const countriesDir = path.resolve(dirPath.data, "raw/countries");
    const countriesMap = await this.returnCountryDataMap(countriesDir);
    const countryEntities = new Set<CountryEntity>();

    // Construct entities
    countriesMap.forEach((countryData, countryCode) => {
      const { alpha2, name } = countryData;
      const countryEntity = em.create(CountryEntity, {
        code: countryCode,
        altCode: alpha2,
        name: Object.fromEntries(name),
      });
      countryEntities.add(countryEntity);
    });

    // Write
    await em.persistAndFlush([...countryEntities]);

    // End
    this.#logger.success("Writing countries data into database completed.");
  }

  private static async writeCountryDataPatch() {
    // Start
    this.#logger.start("Start patching countries data...");

    // Prepare database instance
    const db = Database.getInstance();
    const { em } = db;

    // Declare required variables
    const patchDir = path.resolve(dirPath.data, "patch/countries");
    const countriesMap = await this.returnCountryDataMap(patchDir);

    // Upsert data
    /// Since there is no native method of upserting json, so use this format to perform update.
    await Promise.all(
      [...countriesMap].map(async ([countryCode, countryData]) => {
        const existedEntity = await em.findOne(CountryEntity, { code: countryCode });
        if (existedEntity) {
          const { name } = existedEntity; // Get current name
          existedEntity.name = { ...name, ...Object.fromEntries(countryData.name) };
        } else {
          const newEntity = em.create(CountryEntity, {
            code: countryCode,
            altCode: countryData.alpha2,
            name: Object.fromEntries(countryData.name),
          });
          em.persist(newEntity);
        }
      }),
    );
    await em.flush();

    // End
    this.#logger.success("Finish patching countries data.");
  }

  private static async returnCountryDataMap(dataDir: string) {
    // Declare data map
    type CountryData = { id: number; alpha2: string; alpha3: string; name: string };
    /** @definition Map<alpha3, { alpha2, Map<lang, localizedName> }> */
    const countriesMap = new Map<string, { alpha2: string; name: Map<string, string> }>();

    // Read data
    const dirents = await fs.readdir(dataDir);
    const filenames = dirents.filter((name) => name.endsWith("json"));

    if (filenames.length === 0) {
      throw new NotFoundError("No countries data found.");
    }

    // Read all files concurrently
    await Promise.all(
      filenames.map(async (filename) => {
        // Set current locale from filename
        const locale = filename.replace(".json", "");
        // Read
        const dataPath = path.resolve(dataDir, filename);
        const dataString = await fs.readFile(dataPath, "utf-8");
        const dataJson: CountryData[] = JSON.parse(dataString);
        // Convert data and insert to Map
        dataJson.forEach((country) => {
          const { alpha2, alpha3, name } = country;
          const countryCode = alpha3.toUpperCase();
          const countryData = countriesMap.get(countryCode)
            ?? { alpha2: alpha2.toUpperCase(), name: new Map<string, string>() };
          countryData.name.set(locale, name);
          countriesMap.set(countryCode, countryData);
        });
      }),
    );

    return countriesMap;
  }

  private static async writeVisaPolicyData() {
    // Start
    this.#logger.start("Writing visa policy data into database...");

    // Prepare database instance
    const db = Database.getInstance();
    const { em } = db;

    //  Acquire URL
    const visaPolicyUrl = process.env.RAW_PASSPORT_INDEX_DATA_URL;
    if (!visaPolicyUrl) {
      throw new ReferenceError("visa policy data URL is not defined.");
    }

    // Prepare Data
    const response = await fetch(visaPolicyUrl);
    const dataString = await response.text();
    const linelist = dataString.trim().split("\n").filter((line) => line);

    // Write
    await Promise.all(linelist.map(async (line, index) => {
      const [fromCountryTag, toCountryTag, policy] = line.split(",");
      if (index !== 0 && fromCountryTag !== toCountryTag) {
        const isFreedomOfMovement = policy === "visa free";
        const isAdmissionRefuse = policy === "no admission";
        const isVisaFree = !Number.isNaN(Number(policy)); // Check numeric string
        const entity = em.create(VisaPolicyEntity, {
          fromCountry: await em.findOneOrFail(CountryEntity, { code: fromCountryTag }),
          toCountry: await em.findOneOrFail(CountryEntity, { code: toCountryTag }),
          visaRequirementType: (() => {
            if (isVisaFree) {
              return "visa free";
            }
            if (isFreedomOfMovement) {
              return "freedom of movement";
            }
            return policy;
          })(),
          stayDuration: isFreedomOfMovement || isAdmissionRefuse || !isVisaFree
            ? -1
            : parseInt(policy, 10),
          travelDocumentType: "Ordinary",
        });
        em.persist(entity);
      }
    }));
    await em.flush();

    // End
    this.#logger.success("Writing visa policy data into database completed.");
  }

  private static async writeAirlineRoutesData() {
    this.#logger.start("Writing airline routes data into database...");

    // Prepare database instance
    const db = Database.getInstance();
    const { em } = db;

    // Prepare data
    let dataString: string;
    const isPreferFetchOnline = process.env.PREFER_FETCH_ONLINE === "true";
    const airlineRouteDataUrl = process.env.RAW_AIRLINE_ROUTE_DATA_URL;
    if (isPreferFetchOnline && airlineRouteDataUrl) {
      const response = await fetch(airlineRouteDataUrl);
      dataString = await response.text();
    } else {
      const dataDir = dirPath.data;
      const airlineRoutesPath = path.resolve(dataDir, "raw", "airline_routes.json");
      dataString = await fs.readFile(airlineRoutesPath, "utf-8");
    }
    const dataJson: AirlineRouteJson = JSON.parse(dataString);
    const dataEntries = Object.entries(dataJson);

    // Prepare data entities variables
    const airportEntities = new Set<AirportEntity>();
    const routeEntities = new Set<RouteEntity>();
    const carrierEntities = new Set<CarrierEntity>();
    const routeCarrierEntities = new Set<RouteCarrierEntity>();

    // Prepare temporary data variables
    const airportIdMap = new Map<string, string>(); // Map<iata, uuid>
    const airportRouteMap = new Map<string, Set<RouteInfo>>(); // Map<fromAirportId, RouteInfow>
    const carrierNameSet = new Set<string>(); // Prepare carrier set before turning into entity
    const carrierIdMap = new Map<string, string>(); // Map<carrier, uuid>
    const routeCarrierMap = new Map<string, Set<string>>(); // Map<carrier, Set<routeId>>

    // Iterating throug data entries to construct the ready-to-write data for writing into database
    await Promise.all(dataEntries.map(async ([_airportCode, data]) => {
      // Filter the invalid data in raw data
      if (data.latitude === null || data.longitude === null) {
        return;
      }

      // Construct AirportEntity
      const airportEntity = em.create(AirportEntity, {
        cityName: data.city_name,
        continent: data.continent,
        country: await em.findOneOrFail(CountryEntity, { altCode: data.country_code }),
        displayName: data.display_name,
        elevation: data.elevation,
        iata: data.iata,
        icao: data.icao,
        latitude: data.latitude,
        longitude: data.longitude,
        name: data.name,
        timezone: data.timezone,
      });
      airportEntities.add(airportEntity);

      const airportId = airportEntity.uuid;
      const routeData = data.routes;
      // Store temporary data into Map for fast searching
      airportIdMap.set(data.iata, airportId);
      airportRouteMap.set(airportId, new Set(routeData));
    }));

    // Write airport data first to established the foreign keys referrence for other entities
    await em.persistAndFlush([...airportEntities]);

    // Then continue for creating route entity
    airportRouteMap.forEach((routeSet, fromAirportId) => {
      routeSet.forEach((route) => {
        // Set up route entities
        const toAirportId = airportIdMap.get(route.iata);
        if (!toAirportId) return; // ignore if there is no corresponding airport's id
        const routeEntity = em.create(RouteEntity, {
          fromAirport: fromAirportId,
          toAirport: toAirportId,
          distance: route.km,
          time: route.min,
        });
        routeEntities.add(routeEntity);

        // Set up temporary carrier and route-carrier data
        const routeId = routeEntity.uuid;
        const currRouteCarriers = route.carriers;
        currRouteCarriers.forEach((carrier) => {
          const carrierName = carrier ?? "null"; // if carrier is null, set it to "null" string
          carrierNameSet.add(carrierName);
          const carrierRouteSet = routeCarrierMap.get(carrierName) ?? new Set();
          carrierRouteSet.add(routeId);
          routeCarrierMap.set(carrierName, carrierRouteSet);
        });
      });
    });

    // Write route data
    await em.persistAndFlush([...routeEntities]);

    // Creating CarrierEntity
    carrierNameSet.forEach((carrierName) => {
      const carrierEntity = em.create(CarrierEntity, {
        name: carrierName,
      });
      carrierEntities.add(carrierEntity);
      carrierIdMap.set(carrierName, carrierEntity.uuid);
    });

    // Write for carrier data
    await em.persistAndFlush([...carrierEntities]);

    // Creating RouteCarrierEntity
    routeCarrierMap.forEach((routeSet, carrierName) => {
      routeSet.forEach((routeId) => {
        const carrierId = carrierIdMap.get(carrierName);
        if (!carrierId) return;
        const routeCarrierEntity = em.create(RouteCarrierEntity, {
          carrier: carrierId,
          route: routeId,
        });
        routeCarrierEntities.add(routeCarrierEntity);
      });
    });

    // Write for route carrier data
    await em.persistAndFlush([...routeCarrierEntities]);

    this.#logger.success("Writing airline routes data into database completed.");
  }

  private static async patchVisaPolicyData() {
    //
  }
}

export default InitializeService;
