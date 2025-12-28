import { z } from "zod";

/**
 * Validation schemas using Zod
 */

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  displayName: z.string().max(50, "Display name is too long").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const facebookLoginSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
});

export const verifyEmailSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only digits"),
});

export const resendVerificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  email: z.string().email("Invalid email address"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type FacebookLoginInput = z.infer<typeof facebookLoginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
