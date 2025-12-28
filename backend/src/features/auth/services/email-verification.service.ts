import crypto from "crypto";
import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import { redisClient, isRedisConnected } from "@/shared/config/redis.js";
import { env } from "@/shared/config/env.js";

/**
 * Email verification service for managing verification codes and rate limiting
 */
export class EmailVerificationService {
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = parseInt(
    env.EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES,
  );
  private readonly MAX_VERIFICATION_ATTEMPTS = parseInt(
    env.EMAIL_VERIFICATION_MAX_ATTEMPTS,
  );
  private readonly MAX_RESEND_ATTEMPTS = parseInt(
    env.EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR,
  );
  private readonly RESEND_COOLDOWN_SECONDS = parseInt(
    env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  );

  /**
   * Generate cryptographically secure 6-digit verification code
   */
  generateVerificationCode(): string {
    const code = crypto.randomInt(100000, 999999).toString();
    return code;
  }

  /**
   * Store verification code in database with expiration
   */
  async storeVerificationCode(userId: string, code: string): Promise<void> {
    const expiresAt = new Date(
      Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000,
    );

    const { error } = await supabase
      .from("user_profiles")
      .update({
        verification_code: code,
        verification_code_expires_at: expiresAt.toISOString(),
      })
      .eq("id", userId);

    if (error) {
      logger.error("Failed to store verification code", { userId, error });
      throw new AppError(
        500,
        "Failed to store verification code",
        "CODE_STORE_ERROR",
      );
    }

    logger.info("Verification code stored", {
      userId,
      expiresAt: expiresAt.toISOString(),
    });
  }

  /**
   * Verify code with rate limiting and expiration check
   */
  async verifyCode(userId: string, code: string, ip: string): Promise<boolean> {
    // Check rate limiting using Redis
    const attemptsKey = `email_verify_attempts:${userId}:${ip}`;

    if (isRedisConnected()) {
      const attempts = await redisClient.incr(attemptsKey);

      if (attempts === 1) {
        // Set expiration on first attempt (matches code expiry)
        await redisClient.expire(
          attemptsKey,
          this.CODE_EXPIRY_MINUTES * 60,
        );
      }

      if (attempts > this.MAX_VERIFICATION_ATTEMPTS) {
        logger.warn("Verification attempts exceeded", { userId, ip, attempts });
        throw new AppError(
          429,
          "Too many verification attempts. Please request a new code.",
          "VERIFICATION_ATTEMPTS_EXCEEDED",
        );
      }
    }

    // Fetch stored code from database
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("verification_code, verification_code_expires_at, email_verified")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    // Already verified
    if (profile.email_verified) {
      logger.info("User already verified", { userId });
      return true;
    }

    // No code stored
    if (!profile.verification_code || !profile.verification_code_expires_at) {
      throw new AppError(
        400,
        "No verification code found. Please request a new code.",
        "NO_CODE_FOUND",
      );
    }

    // Check expiration
    if (new Date(profile.verification_code_expires_at) < new Date()) {
      throw new AppError(
        400,
        "Verification code expired. Please request a new code.",
        "CODE_EXPIRED",
      );
    }

    // Verify code using constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(profile.verification_code),
      Buffer.from(code),
    );

    if (!isValid) {
      logger.warn("Invalid verification code", { userId, ip });
      throw new AppError(400, "Invalid verification code", "INVALID_CODE");
    }

    // Mark as verified and clear code
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        email_verified: true,
        verification_code: null,
        verification_code_expires_at: null,
      })
      .eq("id", userId);

    if (updateError) {
      logger.error("Failed to mark email as verified", {
        userId,
        error: updateError,
      });
      throw new AppError(500, "Verification failed", "VERIFICATION_ERROR");
    }

    // Clear rate limit attempts on success
    if (isRedisConnected()) {
      await redisClient.del(attemptsKey);
    }

    logger.info("Email verified successfully", { userId });
    return true;
  }

  /**
   * Check if user can resend verification code (rate limiting)
   */
  async canResendCode(
    userId: string,
    ip: string,
  ): Promise<{ canResend: boolean; remainingSeconds?: number }> {
    if (!isRedisConnected()) {
      return { canResend: true };
    }

    const resendKey = `email_resend:${userId}:${ip}`;
    const resendCountKey = `email_resend_count:${userId}:${ip}`;

    // Check cooldown (60 seconds between resends)
    const cooldownTTL = await redisClient.ttl(resendKey);
    if (cooldownTTL > 0) {
      return { canResend: false, remainingSeconds: cooldownTTL };
    }

    // Check resend count (max 3 per hour)
    const resendCount = await redisClient.get(resendCountKey);
    if (resendCount && parseInt(resendCount) >= this.MAX_RESEND_ATTEMPTS) {
      const countTTL = await redisClient.ttl(resendCountKey);
      throw new AppError(
        429,
        `Too many resend attempts. Please try again in ${Math.ceil(countTTL / 60)} minutes.`,
        "RESEND_LIMIT_EXCEEDED",
      );
    }

    return { canResend: true };
  }

  /**
   * Record resend attempt (for rate limiting)
   */
  async recordResendAttempt(userId: string, ip: string): Promise<void> {
    if (!isRedisConnected()) return;

    const resendKey = `email_resend:${userId}:${ip}`;
    const resendCountKey = `email_resend_count:${userId}:${ip}`;

    // Set cooldown (60 seconds)
    await redisClient.setex(resendKey, this.RESEND_COOLDOWN_SECONDS, "1");

    // Increment resend count
    const count = await redisClient.incr(resendCountKey);
    if (count === 1) {
      // Set expiration on first resend (1 hour)
      await redisClient.expire(resendCountKey, 3600);
    }

    logger.info("Resend attempt recorded", { userId, ip, count });
  }

  /**
   * Generate and store verification code (convenience method)
   */
  async generateAndStore(userId: string): Promise<string> {
    const code = this.generateVerificationCode();
    await this.storeVerificationCode(userId, code);
    return code;
  }
}
