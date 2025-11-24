/**
 * Auth Feature - Public API
 *
 * This file exports all public interfaces of the auth feature
 * Other features should import from this file, not from internal modules
 */

export { default as authRoutes } from './auth.routes.js'
export { authMiddleware, optionalAuthMiddleware } from './auth.middleware.js'
export { AuthService } from './auth.service.js'
export type {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  UserProfile,
  SupabaseUser
} from './auth.types.js'
