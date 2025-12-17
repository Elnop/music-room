import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";

/**
 * Shared database helper functions to reduce code duplication
 */

/**
 * Fetch a single record from database
 * Throws AppError if not found or on error
 */
export async function fetchSingle<T>(
  client: SupabaseClient,
  table: string,
  filter: Record<string, any>,
  select = "*",
  errorMessage = "Record not found",
  errorCode = "NOT_FOUND",
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
 * Fetch multiple records from database
 * Returns empty array if none found
 */
export async function fetchMany<T>(
  client: SupabaseClient,
  table: string,
  filter?: Record<string, any>,
  select = "*",
  orderBy?: { column: string; ascending?: boolean },
): Promise<T[]> {
  let query = client.from(table).select(select);

  // Apply filters if provided
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }
  }

  // Apply ordering if provided
  if (orderBy) {
    query = query.order(orderBy.column, {
      ascending: orderBy.ascending ?? true,
    });
  }

  const { data, error } = await query;

  if (error) {
    logger.error(`Failed to fetch records from ${table}`, { error, filter });
    throw new AppError(500, "Failed to fetch records", "FETCH_ERROR");
  }

  return (data as T[]) || [];
}

/**
 * Insert a single record into database
 */
export async function insertOne<T>(
  client: SupabaseClient,
  table: string,
  data: Record<string, any>,
  select = "*",
  errorMessage = "Failed to insert record",
  errorCode = "INSERT_ERROR",
): Promise<T> {
  const { data: inserted, error } = await client
    .from(table)
    .insert(data)
    .select(select)
    .single();

  if (error || !inserted) {
    logger.error(`Failed to insert into ${table}`, { error, data });
    throw new AppError(500, errorMessage, errorCode);
  }

  return inserted as T;
}

/**
 * Update a single record in database
 */
export async function updateOne<T>(
  client: SupabaseClient,
  table: string,
  filter: Record<string, any>,
  data: Record<string, any>,
  select = "*",
  errorMessage = "Failed to update record",
  errorCode = "UPDATE_ERROR",
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
  filter: Record<string, any>,
  errorMessage = "Failed to delete record",
  errorCode = "DELETE_ERROR",
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

/**
 * Check if record exists
 */
export async function recordExists(
  client: SupabaseClient,
  table: string,
  filter: Record<string, any>,
): Promise<boolean> {
  let query = client.from(table).select("id", { count: "exact", head: true });

  // Apply filters
  for (const [key, value] of Object.entries(filter)) {
    query = query.eq(key, value);
  }

  const { error, count } = await query;

  if (error) {
    logger.error(`Failed to check existence in ${table}`, { error, filter });
    return false;
  }

  return (count ?? 0) > 0;
}
