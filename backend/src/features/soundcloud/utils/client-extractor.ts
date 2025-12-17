import { logger } from "@/shared/utils/logger.js";

/**
 * Extract client_id from soundcloud.ts instance
 * The soundcloud.ts library automatically extracts client_id from SoundCloud website
 */
export function extractClientId(soundcloudInstance: any): string | null {
  // Try to get client_id from api.clientId property
  if (
    soundcloudInstance.api?.clientId &&
    typeof soundcloudInstance.api.clientId === "string"
  ) {
    logger.info("SoundCloud client ID extracted from api.clientId");
    return soundcloudInstance.api.clientId;
  }

  // Try to call getClientId() method
  if (typeof soundcloudInstance.api?.getClientId === "function") {
    try {
      const id = soundcloudInstance.api.getClientId();
      if (id && typeof id === "string") {
        logger.info("SoundCloud client ID extracted from api.getClientId()");
        return id;
      }
    } catch (err) {
      logger.debug("Failed to call api.getClientId()", { error: err });
    }
  }

  logger.warn("Could not extract client_id from soundcloud instance");
  return null;
}

/**
 * Initialize SoundCloud instance with proper class resolution
 * soundcloud.ts exports the class in different ways depending on module system
 */
export function initializeSoundcloudInstance(SoundcloudModule: any): any {
  const SoundcloudClass =
    (SoundcloudModule as any).default ||
    (SoundcloudModule as any).Soundcloud ||
    SoundcloudModule;

  return new SoundcloudClass();
}
