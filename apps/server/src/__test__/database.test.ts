import assert from "node:assert";
import { after, before, describe, test } from "node:test";
import Database from "../database";
import { CountryEntity } from "../entities";

describe("[Unit] Database test", () => {
  after(async () => {
    await Database.getInstance().disconnect();
  });

  test("should return the same instance for singleton database instance", () => {
    const instance1 = Database.getInstance();
    const instance2 = Database.getInstance();
    assert.strictEqual(instance1, instance2, "The database instance is the same.");
  });

  test("should throw an error when accessing orm before connecting", () => {
    const db = Database.getInstance();
    assert.throws(() => db.orm, Error, "The database is not initialized.");
  });

  test("should throw an error when accessing em before connecting", () => {
    const db = Database.getInstance();
    assert.throws(() => db.em, Error, "The database is not initialized.");
  });

  test("should not throw an error when disconnecting from an uninitialized database", async () => {
    const db = Database.getInstance();
    await assert.doesNotReject(db.disconnect());
  });

  test("should able to connect to the database", async () => {
    const db = Database.getInstance();
    await db.connect();
    const isConnected = await db.checkConnection();
    assert.strictEqual(isConnected, true, "The database is connected.");
  });

  test("should able to disconnect from the database", async () => {
    const db = Database.getInstance();
    await db.connect();
    await db.disconnect();
    const isConnected = await db.checkConnection();
    assert.strictEqual(isConnected, false, "The database is disconnected.");
  });

  test("should initialize the database after connect", async () => {
    const db = Database.getInstance();
    await db.connect();
    const { orm, em } = db; // Should not throw "The database is not initialized." error here.
    assert.ok(orm, "There is an orm instance.");
    assert.ok(em, "There is an entity manager instance.");
  });

  test("should not be the same instance for different entity manager", async () => {
    const db = Database.getInstance();
    await db.connect();
    const em1 = db.em;
    const em2 = db.em;
    assert.notStrictEqual(em1, em2, "The entity manager instance is not the same.");
  });
});

describe("[Unit] Database's data test", () => {
  const db = Database.getInstance();

  before(async () => {
    await db.connect();
  });

  after(async () => {
    await db.disconnect();
  });

  test("should able to retrieve data from the database", async () => {
    const { em } = db;
    const data = await em.findOneOrFail(CountryEntity, { code: "HKG" });
    const expected = {
      altCode: "HK",
      name: {
        en: "Hong Kong",
        zh: "香港",
      },
      code: "HKG",
    };
    assert.deepStrictEqual(data.altCode, expected.altCode, "The altCode is the same.");
    assert.deepStrictEqual(data.name, expected.name, "The name is the same.");
  });
});
