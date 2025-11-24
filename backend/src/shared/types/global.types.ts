import type { Request } from 'express'

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    role?: string
  }
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
