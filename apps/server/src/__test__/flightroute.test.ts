import consola from "consola";
import assert from "node:assert";
import { after, before, describe, test } from "node:test";
import Database from "../database";
import { FlightRouteService } from "../services";

describe("[Unit] FlightRouteService", () => {
  before(async () => {
    const db = Database.getInstance();
    await db.connect();
  });

  test("should return direct flight", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "HKG",
      to: "NRT",
      travelDocs: [{ nationality: "HKG", type: "Ordinary" }],
      visaInfos: [],
    });
    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.strictEqual(result.size, 1);
    assert.deepStrictEqual([...itineraryResults], ["HKG", "NRT"]);
  });

  test("should return multiple direct flights if there is transit route but all have direct flight", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "HKG",
      to: "NRT",
      transitThrough: ["TPE"],
      travelDocs: [{ nationality: "HKG", type: "Ordinary" }],
      visaInfos: [],
    });
    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.strictEqual(result.size, 2);
    assert.deepStrictEqual([...itineraryResults], ["HKG", "TPE", "NRT"]);
  });

  test("should return transit flight", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "BKK",
      to: "MEX",
      travelDocs: [{ nationality: "HKG", type: "Ordinary" }],
      visaInfos: [{ country: "USA", type: "Tourist" }],
    });

    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.ok(itineraryResults.has("BKK"));
    assert.ok(itineraryResults.has("MEX"));
  });

  test("should return transit flight with multiple passports", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "BKK",
      to: "MEX",
      travelDocs: [
        { nationality: "HKG", type: "Ordinary" },
        { nationality: "CAN", type: "Ordinary" },
      ],
      visaInfos: [],
    });

    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.ok(itineraryResults.has("BKK"));
    assert.ok(itineraryResults.has("MEX"));
  });

  test("should return transit flight with transit routes without visa and not powerful passport", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "BKK",
      to: "MEX",
      travelDocs: [{ nationality: "CHN", type: "Ordinary" }],
      visaInfos: [],
    });

    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.ok(itineraryResults.has("BKK"));
    assert.ok(itineraryResults.has("MEX"));
  });

  test("should return transit flight with transit routes specified", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "BKK",
      transitThrough: ["LAX"],
      to: "EZE",
      travelDocs: [{ nationality: "HKG", type: "Ordinary" }],
      visaInfos: [{ country: "USA", type: "Tourist" }],
    });

    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.ok(itineraryResults.has("BKK"));
    assert.ok(itineraryResults.has("EZE"));
  });

  test("should return long transit chains with powerful passport", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "ZQN",
      to: "TOS",
      travelDocs: [{ nationality: "USA", type: "Ordinary" }],
      visaInfos: [],
    });

    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.ok(itineraryResults.has("ZQN"));
    assert.ok(itineraryResults.has("TOS"));
  });

  test("should return long transit chains with not so powerful passport", async () => {
    const result = await FlightRouteService.calculateRoute({
      from: "ZQN",
      to: "TOS",
      travelDocs: [{ nationality: "CHN", type: "Ordinary" }],
      visaInfos: [],
    });

    const itineraryResults = new Set<string>();
    result.forEach((routeDataArr) => {
      routeDataArr.forEach((routeData) => {
        itineraryResults.add(routeData.from.airport.iata);
        itineraryResults.add(routeData.to.airport.iata);
      });
    });
    consola.info(itineraryResults);
    assert.ok(itineraryResults.has("ZQN"));
    assert.ok(itineraryResults.has("TOS"));
  });

  test("should throw an error if it is invalid value", async () => {
    try {
      await FlightRouteService.calculateRoute({
        from: "LAX",
        to: "ZZZ",
        transitThrough: [],
        travelDocs: [
          { nationality: "USA", type: "Ordinary" },
        ],
        visaInfos: [],
      });
      assert.fail("Expected an error to be thrown");
    } catch (err) {
      assert.ok(err instanceof Error, "Error should be an instance of Error");
    }
  });

  after(async () => {
    const db = Database.getInstance();
    await db.disconnect();
  });
});
