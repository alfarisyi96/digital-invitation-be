export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface Reseller {
  id: string;
  user_id: string;
  referral_code: string;
  type: 'FREE' | 'PREMIUM';
  landing_slug: string | null;
  custom_domain: string | null;
  created_at: Date;
}

export interface Plan {
  id: string;
  name: string;
  type: 'FREE' | 'PREMIUM';
  price: number;
  invite_type: 'WEDDING' | 'BIRTHDAY' | 'PARTY' | 'CORPORATE' | 'OTHER';
  created_at: Date;
}

export interface Template {
  id: string;
  plan_id: string;
  name: string;
  preview_url: string;
  component_id: string;
  created_at: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  reseller_id: string | null;
  created_at: Date;
}

export interface Invite {
  id: string;
  user_id: string;
  plan_id: string;
  template_id: string;
  type: 'WEDDING' | 'BIRTHDAY' | 'PARTY' | 'CORPORATE' | 'OTHER';
  slug: string;
  form_data: Record<string, any>;
  is_published: boolean;
  created_at: Date;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateResellerRequest {
  type?: 'FREE' | 'PREMIUM';
  landing_slug?: string;
  custom_domain?: string;
}

export interface StatsResponse {
  totalUsers: number;
  totalInvites: number;
  totalResellers: number;
  recentSignups: number;
  planDistribution: Record<string, number>;
  resellerTypeDistribution: {
    FREE: number;
    PREMIUM: number;
  };
}

export type InviteType = 'WEDDING' | 'BIRTHDAY' | 'PARTY' | 'CORPORATE' | 'OTHER';
export type PlanType = 'FREE' | 'PREMIUM';
export type ResellerType = 'FREE' | 'PREMIUM';
