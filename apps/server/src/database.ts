import { BetterSqliteDriver } from "@mikro-orm/better-sqlite";
import { MikroORM } from "@mikro-orm/core";
import { ConsolaInstance } from "consola";
import path from "path";
import { logger as consola } from "./utils";

class Database {
  static #instance: Database; // Equivalent to private static
  #orm: MikroORM<BetterSqliteDriver> | null; // Equivalent to private
  #logger: ConsolaInstance; // Equivalent to private

  private constructor() {
    this.#orm = null;
    this.#logger = consola.withTag("Database");
  }

  /**
   * Get the singleton instance of the Database class.
   */
  public static getInstance() {
    if (!this.#instance) {
      this.#instance = new Database();
    }
    return this.#instance;
  }

  // Setters and Getters //

  /**
   * Get the ORM instance.
   */
  public get orm() {
    if (!this.#orm) {
      this.throwDatabaseNotInitializedError();
    }
    return this.#orm!;
  }

  /**
   * Get the new entity manager instance.
   */
  public get em() {
    if (!this.#orm) {
      this.throwDatabaseNotInitializedError();
    }
    return this.#orm!.em.fork(); // Returen a fork to prevent context pollution
  }

  // Methods //

  /**
   * Connect to the database.
   */
  public async connect() {
    this.#logger.start("Connecting to the database...");
    try {
      if (!this.#orm) {
        this.#orm = await MikroORM.init<BetterSqliteDriver>({
          driver: BetterSqliteDriver,
          forceUtcTimezone: true,
          dbName: path.resolve(process.cwd(), "data", process.env.DB_NAME ?? "data.db"),
          entities: [path.resolve(__dirname, "entities/*.entity.js")],
          entitiesTs: [path.resolve(__dirname, "entities/*.entity.ts")],
        });
        this.#logger.success("The database is connected.");
      } else {
        const isConnected = await this.checkConnection();
        if (!isConnected) {
          await this.#orm.connect();
          this.#logger.success("The database is connected.");
        } else {
          this.#logger.warn("The database is already connected.");
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.#logger.error(`Failed to connect to the database: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Disconnect from the database.
   */
  public async disconnect() {
    this.#logger.start("Disconnecting from the database...");
    try {
      if (this.#orm) {
        const isConnected = await this.checkConnection();
        if (isConnected) {
          await this.#orm.close(true);
          this.#logger.success("The database is disconnected.");
        } else {
          this.#logger.warn("The database is already disconnected.");
        }
      } else {
        this.#logger.warn("The database is not initialized.");
      }
    } catch (error) {
      if (error instanceof Error) {
        this.#logger.error(`Failed to disconnect from the database: ${error.message}`);
        throw error;
      }
    }
  }

  public async checkConnection() {
    if (this.#orm) {
      const result = await this.#orm.checkConnection();
      return result.ok;
    }
    return false;
  }

  // Class Helpers //

  /**
   * Throw an error when the database is not initialized.
   */
  private throwDatabaseNotInitializedError() {
    const errorMsg = "The database is not initialized.";
    this.#logger.error(errorMsg);
    throw new ReferenceError(errorMsg);
  }
}

export default Database;
