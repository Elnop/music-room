import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";
import type { ApiResponse } from "../types/global.types.js";

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error("Error occurred", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: {
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(400).json(response);
  }

  // Custom AppError
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(err.statusCode).json(response);
  }

  // Supabase errors
  if ("code" in err && "message" in err) {
    const supabaseError = err as Error & { code: string };
    const response: ApiResponse = {
      success: false,
      error: {
        message: err.message,
        code: supabaseError.code,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(400).json(response);
  }

  // Default error
  const response: ApiResponse = {
    success: false,
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  res.status(500).json(response);
}
