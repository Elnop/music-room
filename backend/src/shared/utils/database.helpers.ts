import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * Shared database helper functions to reduce code duplication
 */

/**
 * Database filter value types
 */
type DbFilterValue = string | number | boolean | null;

/**
 * Database record type for inserts/updates
 */
type DbRecord = Record<string, DbFilterValue | DbFilterValue[] | undefined>;

/**
 * Fetch a single record from database
 * Throws AppError if not found or on error
 */
export async function fetchSingle<T>(
	client: SupabaseClient,
	table: string,
	filter: Record<string, DbFilterValue>,
	select = '*',
	errorMessage = 'Record not found',
	errorCode = 'NOT_FOUND'
): Promise<T> {
	let query = client.from(table).select(select);

	// Apply filters
	for (const [key, value] of Object.entries(filter)) {
		query = query.eq(key, value);
	}

	const { data, error } = await query.single();

	if (error || !data) {
		logger.error(`Failed to fetch single record from ${table}`, {
			error,
			filter,
		});
		throw new AppError(404, errorMessage, errorCode);
	}

	return data as T;
}

/**
 * Update a single record in database
 */
export async function updateOne<T>(
	client: SupabaseClient,
	table: string,
	filter: Record<string, DbFilterValue>,
	data: DbRecord,
	select = '*',
	errorMessage = 'Failed to update record',
	errorCode = 'UPDATE_ERROR'
): Promise<T> {
	let query = client.from(table).update(data);

	// Apply filters
	for (const [key, value] of Object.entries(filter)) {
		query = query.eq(key, value);
	}

	const { data: updated, error } = await query.select(select).single();

	if (error || !updated) {
		logger.error(`Failed to update ${table}`, { error, filter, data });
		throw new AppError(500, errorMessage, errorCode);
	}

	return updated as T;
}

/**
 * Delete records from database
 */
export async function deleteRecords(
	client: SupabaseClient,
	table: string,
	filter: Record<string, DbFilterValue>,
	errorMessage = 'Failed to delete record',
	errorCode = 'DELETE_ERROR'
): Promise<void> {
	let query = client.from(table).delete();

	// Apply filters
	for (const [key, value] of Object.entries(filter)) {
		query = query.eq(key, value);
	}

	const { error } = await query;

	if (error) {
		logger.error(`Failed to delete from ${table}`, { error, filter });
		throw new AppError(500, errorMessage, errorCode);
	}
}
