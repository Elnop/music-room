import type { Request } from "express";

// RateLimitInfo type from express-rate-limit
interface RateLimitInfo {
  limit: number;
  used: number;
  remaining: number;
  resetTime: Date | undefined;
  key: string;
}

// Extend Express Request to include rateLimit info
declare global {
  namespace Express {
    interface Request {
      rateLimit?: RateLimitInfo;
    }
  }
}

/**
 * Action log context containing client metadata
 */
export interface ActionLogContext {
  platform?: string;
  device?: string;
  appVersion?: string;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  actionLogContext?: ActionLogContext;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
