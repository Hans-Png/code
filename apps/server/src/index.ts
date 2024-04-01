import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Database from "./database";
import routes from "./routes/routes";
import { InitializeService } from "./services";
import { logger as consola } from "./utils";

dotenv.config({ path: "../.env" });

const performTasks = async () => {
  // Sub method for disconnecting the service after performing task
  const disconnectService = async () => {
    const db = Database.getInstance();
    await db.disconnect();
    process.exit(0);
  };

  // Handle request
  const argv = [...new Set(process.argv.slice(2))];
  await Promise.all(
    argv.map(async (arg, index) => {
      switch (arg) {
        case "--init": {
          const task = async () => {
            await InitializeService.initializeDatabase();
            if (argv.length === index + 1) {
              await disconnectService();
            }
          };
          return task();
        }
        default: {
          const errorMessage = `Unknown argument: ${arg}`;
          consola.error(errorMessage);
          throw new Error(errorMessage);
        }
      }
    }),
  );
};

const startServer = async () => {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

  // Notify starting server
  consola.start("Starting server...");

  // Start database
  const db = Database.getInstance();
  await db.connect();

  // Check argv and perform tasks
  await performTasks();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Register route into express app
  routes.forEach((route) => {
    app.use(route.getPath(), route.getRouter());
  });

  // Start express server
  app.listen(port, () => {
    consola.success(`Server started on port ${port}.`);
  });
};

startServer();
