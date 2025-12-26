import { env } from "../config/env.js";

type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Metadata that can be logged alongside messages
 * Can be primitives, objects, arrays, or errors
 */
type LogMetadata =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | Record<string, unknown>
  | unknown[];

class Logger {
  private log(level: LogLevel, message: string, meta?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    if (env.NODE_ENV === "development") {
      const emoji = {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        debug: "🐛",
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, meta || "");
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message: string, meta?: LogMetadata) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: LogMetadata) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: LogMetadata) {
    this.log("error", message, meta);
  }

  debug(message: string, meta?: LogMetadata) {
    if (env.NODE_ENV === "development") {
      this.log("debug", message, meta);
    }
  }
}

export const logger = new Logger();
