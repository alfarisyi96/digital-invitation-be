import { supabase } from '../utils/supabase';
import { Reseller, User, UpdateResellerRequest } from '../types';
import { logger } from '../utils/logger';
import { calculatePagination, generateReferralCode } from '../utils/helpers';

export class ResellerService {
  /**
   * Get paginated list of resellers
   */
  static async getResellers(options: {
    page: number;
    limit: number;
    type?: 'FREE' | 'PREMIUM';
    search?: string;
  }): Promise<{ resellers: (Reseller & { user?: User; referred_users_count?: number })[]; meta: any }> {
    const { page, limit, type, search } = options;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('resellers')
      .select(`
        *,
        users!inner(id, name, email, created_at),
        referred_users:users!reseller_id(count)
      `, { count: 'exact' });
    
    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.or(`users.name.ilike.%${search}%,users.email.ilike.%${search}%,referral_code.ilike.%${search}%`);
    }
    
    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data: resellers, error, count } = await query;
    
    if (error) {
      logger.error('Failed to fetch resellers:', error);
      throw new Error('Failed to fetch resellers');
    }
    
    const meta = calculatePagination(page, limit, count || 0);
    
    return { resellers: resellers || [], meta };
  }
  
  /**
   * Get reseller by ID
   */
  static async getResellerById(id: string): Promise<(Reseller & { user?: User; referred_users?: User[] }) | null> {
    const { data: reseller, error } = await supabase
      .from('resellers')
      .select(`
        *,
        users!inner(*),
        referred_users:users!reseller_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !reseller) {
      return null;
    }
    
    return reseller;
  }
  
  /**
   * Create a new reseller
   */
  static async createReseller(data: {
    user_id: string;
    type: 'FREE' | 'PREMIUM';
    landing_slug?: string;
    custom_domain?: string;
  }): Promise<Reseller> {
    const { user_id, type, landing_slug, custom_domain } = data;
    
    // Check if user already is a reseller
    const { data: existingReseller } = await supabase
      .from('resellers')
      .select('id')
      .eq('user_id', user_id)
      .single();
    
    if (existingReseller) {
      throw new Error('User is already a reseller');
    }
    
    // Generate unique referral code
    let referral_code: string;
    let isUnique = false;
    let attempts = 0;
    
    do {
      referral_code = generateReferralCode(8);
      const { data: existing } = await supabase
        .from('resellers')
        .select('id')
        .eq('referral_code', referral_code)
        .single();
      
      isUnique = !existing;
      attempts++;
      
      if (attempts > 10) {
        throw new Error('Failed to generate unique referral code');
      }
    } while (!isUnique);
    
    // Insert new reseller
    const { data: newReseller, error } = await supabase
      .from('resellers')
      .insert([{
        user_id,
        referral_code,
        type,
        landing_slug,
        custom_domain
      }])
      .select('*')
      .single();
    
    if (error || !newReseller) {
      logger.error('Failed to create reseller:', error);
      throw new Error('Failed to create reseller');
    }
    
    logger.info('New reseller created:', { user_id, id: newReseller.id, referral_code });
    
    return newReseller;
  }
  
  /**
   * Update reseller
   */
  static async updateReseller(id: string, data: UpdateResellerRequest): Promise<Reseller> {
    const { data: updatedReseller, error } = await supabase
      .from('resellers')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error || !updatedReseller) {
      logger.error('Failed to update reseller:', error);
      throw new Error('Failed to update reseller');
    }
    
    logger.info('Reseller updated:', { id, data });
    
    return updatedReseller;
  }
  
  /**
   * Delete reseller
   */
  static async deleteReseller(id: string): Promise<void> {
    const { error } = await supabase
      .from('resellers')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Failed to delete reseller:', error);
      throw new Error('Failed to delete reseller');
    }
    
    logger.info('Reseller deleted:', { id });
  }
  
  /**
   * Get reseller by referral code
   */
  static async getResellerByReferralCode(referral_code: string): Promise<Reseller | null> {
    const { data: reseller, error } = await supabase
      .from('resellers')
      .select('*')
      .eq('referral_code', referral_code)
      .single();
    
    if (error || !reseller) {
      return null;
    }
    
    return reseller;
  }
}
