import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Reseller validation schemas
export const updateResellerSchema = z.object({
  type: z.enum(['FREE', 'PREMIUM']).optional(),
  landing_slug: z.string().min(3).max(50).optional().nullable(),
  custom_domain: z.string().url().optional().nullable(),
});

export const createResellerSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  type: z.enum(['FREE', 'PREMIUM']),
  landing_slug: z.string().min(3).max(50).optional(),
  custom_domain: z.string().url().optional(),
});

// Plan validation schemas
export const createPlanSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  type: z.enum(['FREE', 'PREMIUM']),
  price: z.number().min(0, 'Price cannot be negative'),
  invite_type: z.enum(['WEDDING', 'BIRTHDAY', 'PARTY', 'CORPORATE', 'OTHER']),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(['FREE', 'PREMIUM']).optional(),
  price: z.number().min(0).optional(),
  invite_type: z.enum(['WEDDING', 'BIRTHDAY', 'PARTY', 'CORPORATE', 'OTHER']).optional(),
});

// Template validation schemas
export const createTemplateSchema = z.object({
  plan_id: z.string().uuid('Invalid plan ID'),
  name: z.string().min(2, 'Template name must be at least 2 characters'),
  preview_url: z.string().url('Invalid preview URL'),
  component_id: z.string().min(1, 'Component ID is required'),
});

export const updateTemplateSchema = z.object({
  plan_id: z.string().uuid().optional(),
  name: z.string().min(2).optional(),
  preview_url: z.string().url().optional(),
  component_id: z.string().min(1).optional(),
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
});

export const userQuerySchema = z.object({
  search: z.string().optional(),
  reseller_id: z.string().uuid().optional(),
  ...paginationSchema.shape,
});

export const resellerQuerySchema = z.object({
  type: z.enum(['FREE', 'PREMIUM']).optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const inviteQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  plan_id: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
  type: z.enum(['WEDDING', 'BIRTHDAY', 'PARTY', 'CORPORATE', 'OTHER']).optional(),
  is_published: z.string().transform(val => val === 'true').optional(),
  ...paginationSchema.shape,
});
