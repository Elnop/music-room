import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

// Reads of the "all my devices" switch (`follows(friend → owner).can_control_music`);
// control-switch.service.ts turns it on and off.

/** The users ownerId has turned the switch on for. */
export async function getGrantedPermissions(ownerId: string): Promise<string[]> {
	try {
		const { data, error } = await supabaseAdmin
			.from('follows')
			.select('follower_id')
			.eq('following_id', ownerId)
			.eq('can_control_music', true);

		if (error) {
			logger.error('Failed to get granted permissions', { error, ownerId });
			throw new AppError(500, 'Failed to get permissions', 'GET_PERMISSIONS_ERROR');
		}

		return (data || []).map(row => row.follower_id);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error getting granted permissions', { error });
		throw new AppError(500, 'Failed to get permissions', 'GET_PERMISSIONS_ERROR');
	}
}

/** Whether targetId has turned the switch on for controllerId. Fails closed. */
export async function canControl(controllerId: string, targetId: string): Promise<boolean> {
	try {
		const { data, error } = await supabaseAdmin
			.from('follows')
			.select('can_control_music')
			.eq('follower_id', controllerId)
			.eq('following_id', targetId)
			.single();

		if (error) {
			// PGRST116: no row, controllerId does not follow targetId.
			if (error.code !== 'PGRST116') {
				logger.error('Failed to check control permission', { error, controllerId, targetId });
			}
			return false;
		}

		return data?.can_control_music === true;
	} catch (error) {
		logger.error('Unexpected error checking control permission', { error });
		return false;
	}
}
