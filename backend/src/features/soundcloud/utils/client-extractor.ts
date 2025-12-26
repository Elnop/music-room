import { logger } from "@/shared/utils/logger.js";
import type { SoundCloudClient } from "../soundcloud.types.js";

/**
 * SoundCloud instance with API access
 */
type SoundCloudInstanceWithApi = SoundCloudClient & {
  api?: {
    clientId?: string;
    getClientId?: () => string;
  };
};

/**
 * Extract client_id from soundcloud.ts instance
 * The soundcloud.ts library automatically extracts client_id from SoundCloud website
 */
export function extractClientId(
  soundcloudInstance: SoundCloudInstanceWithApi,
): string | null {
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
 * SoundCloud module/class constructor
 */
type SoundCloudConstructor = new () => SoundCloudClient;

/**
 * Initialize SoundCloud instance with proper class resolution
 * soundcloud.ts exports the class in different ways depending on module system
 */
export function initializeSoundcloudInstance(
  SoundcloudModule: unknown,
): SoundCloudClient {
  const moduleObj = SoundcloudModule as {
    default?: SoundCloudConstructor;
    Soundcloud?: SoundCloudConstructor;
  };

  const SoundcloudClass =
    moduleObj.default ||
    moduleObj.Soundcloud ||
    (SoundcloudModule as SoundCloudConstructor);

  return new SoundcloudClass();
}
