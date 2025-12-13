import { supabase } from '@/shared/config/supabase.js'
import { AppError } from '@/shared/middleware/error-handler.js'
import { logger } from '@/shared/utils/logger.js'
import type { RegisterDTO, LoginDTO, AuthResponse, UserProfile, SupabaseUser } from './auth.types.js'

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    try {
      logger.info('Registering new user', { email: data.email, username: data.username })

      // 1. Check if username already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', data.username)
        .single()

      if (existingProfile) {
        throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN')
      }

      // 2. Create user in Supabase Auth using Admin API
      // Using admin.createUser to bypass email confirmation in development
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email for development
      })

      if (authError) {
        logger.error('Supabase auth signup error', { error: authError })
        throw new AppError(400, authError.message, 'AUTH_ERROR')
      }

      if (!authData.user) {
        throw new AppError(400, 'Failed to create user - no user returned', 'AUTH_ERROR')
      }

      // Generate a session manually using signInWithPassword
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (sessionError || !sessionData.session) {
        logger.error('Failed to create session after user creation', { error: sessionError })
        throw new AppError(500, 'User created but failed to generate session', 'SESSION_ERROR')
      }

      // 3. Create user profile
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: authData.user.id,
        username: data.username,
        display_name: data.displayName,
      })

      if (profileError) {
        logger.error('Failed to create user profile', { error: profileError })
        // Rollback: delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new AppError(500, 'Failed to create user profile', 'PROFILE_ERROR')
      }

      logger.info('User registered successfully', { userId: authData.user.id })

      return this.formatAuthResponse(authData.user, sessionData.session, data.username, data.displayName)
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Unexpected error during registration', { error })
      throw new AppError(500, 'Registration failed', 'REGISTRATION_ERROR')
    }
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    try {
      logger.info('User login attempt', { email: data.email })

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        logger.warn('Login failed', { email: data.email, error: authError.message })
        throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
      }

      if (!authData.user || !authData.session) {
        throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('username, display_name, avatar_url, bio, created_at, updated_at')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        logger.error('Failed to fetch user profile', { userId: authData.user.id, error: profileError })
        throw new AppError(500, 'Failed to fetch user profile', 'PROFILE_ERROR')
      }

      logger.info('User logged in successfully', { userId: authData.user.id })

      return this.formatAuthResponse(
        authData.user,
        authData.session,
        profile.username,
        profile.display_name,
        profile.avatar_url,
        profile.bio,
        profile.created_at,
        profile.updated_at
      )
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Unexpected error during login', { error })
      throw new AppError(500, 'Login failed', 'LOGIN_ERROR')
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<SupabaseUser> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error || !user) {
        throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN')
      }

      return {
        id: user.id,
        email: user.email!,
        role: user.role,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(401, 'Invalid token', 'INVALID_TOKEN')
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)

      if (userError || !user.user) {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        throw new AppError(404, 'User profile not found', 'PROFILE_NOT_FOUND')
      }

      return {
        id: user.user.id,
        email: user.user.email!,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(500, 'Failed to get user profile', 'PROFILE_ERROR')
    }
  }

  /**
   * Format auth response helper
   */
  private formatAuthResponse(
    user: any,
    session: any,
    username: string,
    displayName?: string,
    avatarUrl?: string,
    bio?: string,
    createdAt?: string,
    updatedAt?: string
  ): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        username,
        displayName,
        avatarUrl,
        bio,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      },
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: session.expires_at,
      },
    }
  }
}
