import consola from "consola";
import fs from "fs";
import path from "path";

// Define the directory path for logging
const logDirectoryPath = path.resolve(__dirname, "../../logs");
// Define the file path for logging
const timestamp = new Date().toISOString().replace(/:/g, "_").replace(/\..+/, "");
const logFilePath = path.resolve(logDirectoryPath, `${timestamp}.log`);

// Ensure log directory exists, create it if it doesn't
if (!fs.existsSync(logDirectoryPath)) {
  try {
    fs.mkdirSync(logDirectoryPath, { recursive: true });
  } catch (error) {
    consola.error("Error creating log directory:", error);
    // Exit the process if the log directory cannot be created
    process.exit(1);
  }
}

/**
 * A custom consola instance, should be used instead of consola directly.
 * and should be imported as `logger as consola` for compatibility with consola.
 * @example import { logger as consola } from "../utils"
 */
const logger = consola.create({});

// Add functionality to log into log file
logger.addReporter({
  // Log to file
  log: (logObj) => {
    const logString = `${JSON.stringify(logObj)}\n`;
    fs.appendFile(logFilePath, logString, (error) => {
      if (error) {
        consola.error("Error writing to log file:", error);
      }
    });
  },
});

export default logger;
