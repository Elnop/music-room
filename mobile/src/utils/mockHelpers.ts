/**
 * Mock Helpers
 * Utilities for simulating backend behavior with delays and data manipulation
 */

/**
 * Simulate network delay
 * @param ms Milliseconds to delay (default: 800ms)
 */
export const delay = (ms: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Simulate random network error
 * @param errorRate Probability of error (0-1, default: 0.1 = 10%)
 */
export const simulateNetworkError = (errorRate: number = 0.1): void => {
  if (Math.random() < errorRate) {
    throw new Error('Network error - please try again');
  }
};

/**
 * Generate unique ID with prefix
 * @param prefix ID prefix (e.g., 'user', 'playlist', 'track')
 */
export const generateId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Deep clone object for immutable updates
 * @param obj Object to clone
 */
export const clone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Simulate pagination
 * @param items Array of items
 * @param page Page number (1-indexed)
 * @param limit Items per page
 */
export const paginate = <T>(items: T[], page: number = 1, limit: number = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: items.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasMore: endIndex < items.length,
    },
  };
};

/**
 * Search items by query string
 * @param items Array of items
 * @param query Search query
 * @param fields Fields to search in
 */
export const searchItems = <T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[]
): T[] => {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(lowerQuery);
    })
  );
};
