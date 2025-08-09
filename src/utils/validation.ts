import { z } from 'zod';
import { 
  InvitationType, 
  InvitationFormData,
  WeddingFormData,
  BirthdayFormData,
  GraduationFormData,
  BabyShowerFormData,
  BusinessFormData
} from '../types/invitation';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateInvitationData(
  type: InvitationType, 
  data: Partial<InvitationFormData>
): ValidationResult {
  const errors: string[] = [];

  switch (type) {
    case InvitationType.WEDDING:
      return validateWeddingData(data as Partial<WeddingFormData>);
    case InvitationType.BIRTHDAY:
      return validateBirthdayData(data as Partial<BirthdayFormData>);
    case InvitationType.GRADUATION:
      return validateGraduationData(data as Partial<GraduationFormData>);
    case InvitationType.BABY_SHOWER:
      return validateBabyShowerData(data as Partial<BabyShowerFormData>);
    case InvitationType.BUSINESS:
      return validateBusinessData(data as Partial<BusinessFormData>);
    default:
      errors.push('Invalid invitation type');
  }

  return { isValid: errors.length === 0, errors };
}

function validateWeddingData(data: Partial<WeddingFormData>): ValidationResult {
  const errors: string[] = [];

  // Basic validation - only check if data is provided
  if (data.groomName && typeof data.groomName !== 'string') {
    errors.push('Groom name must be a string');
  }
  
  if (data.brideName && typeof data.brideName !== 'string') {
    errors.push('Bride name must be a string');
  }

  if (data.eventDate && !isValidDate(data.eventDate)) {
    errors.push('Invalid event date');
  }

  if (data.venueName && typeof data.venueName !== 'string') {
    errors.push('Venue name must be a string');
  }

  return { isValid: errors.length === 0, errors };
}

function validateBirthdayData(data: Partial<BirthdayFormData>): ValidationResult {
  const errors: string[] = [];

  if (data.celebrantName && typeof data.celebrantName !== 'string') {
    errors.push('Celebrant name must be a string');
  }

  if (data.age && (typeof data.age !== 'number' || data.age < 0)) {
    errors.push('Age must be a positive number');
  }

  if (data.partyDate && !isValidDate(data.partyDate)) {
    errors.push('Invalid party date');
  }

  return { isValid: errors.length === 0, errors };
}

function validateGraduationData(data: Partial<GraduationFormData>): ValidationResult {
  const errors: string[] = [];

  if (data.graduateName && typeof data.graduateName !== 'string') {
    errors.push('Graduate name must be a string');
  }

  if (data.degree && typeof data.degree !== 'string') {
    errors.push('Degree must be a string');
  }

  if (data.school && typeof data.school !== 'string') {
    errors.push('School must be a string');
  }

  if (data.graduationDate && !isValidDate(data.graduationDate)) {
    errors.push('Invalid graduation date');
  }

  return { isValid: errors.length === 0, errors };
}

function validateBabyShowerData(data: Partial<BabyShowerFormData>): ValidationResult {
  const errors: string[] = [];

  if (data.parentNames && !Array.isArray(data.parentNames)) {
    errors.push('Parent names must be an array');
  }

  if (data.dueDate && !isValidDate(data.dueDate)) {
    errors.push('Invalid due date');
  }

  if (data.partyDate && !isValidDate(data.partyDate)) {
    errors.push('Invalid party date');
  }

  if (data.gender && !['boy', 'girl', 'surprise'].includes(data.gender)) {
    errors.push('Gender must be "boy", "girl", or "surprise"');
  }

  return { isValid: errors.length === 0, errors };
}

function validateBusinessData(data: Partial<BusinessFormData>): ValidationResult {
  const errors: string[] = [];

  if (data.eventTitle && typeof data.eventTitle !== 'string') {
    errors.push('Event title must be a string');
  }

  if (data.company && typeof data.company !== 'string') {
    errors.push('Company must be a string');
  }

  if (data.eventDate && !isValidDate(data.eventDate)) {
    errors.push('Invalid event date');
  }

  return { isValid: errors.length === 0, errors };
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

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
