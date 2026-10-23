export interface RateLimitConfig {
	maxAttempts: number;
	windowSeconds: number;
}

export interface RateLimitResult {
	canProceed: boolean;
	remainingSeconds?: number;
	attempts?: number;
}

export interface LockoutStatus {
	isLocked: boolean;
	failedAttempts: number;
	remainingAttempts?: number;
	lockedUntil?: Date;
	remainingSeconds?: number;
}

export interface IPReputationStatus {
	status: 'normal' | 'throttled' | 'blocked' | 'blacklisted';
	count: number;
}
