import { ApiResponse } from '../types';

/**
 * Create standardized API response
 */
export function createResponse<T>(
  success: boolean,
  data: T | null = null,
  error: string | null = null,
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number }
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    ...(meta && { meta })
  };
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number }
): ApiResponse<T> {
  return createResponse(true, data, null, meta);
}

/**
 * Create error response
 */
export function errorResponse(error: string): ApiResponse<null> {
  return createResponse(false, null, error);
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages
  };
}

/**
 * Generate referral code
 */
export function generateReferralCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse pagination query parameters
 */
export function parsePaginationQuery(query: any): { page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  
  return { page, limit };
}
